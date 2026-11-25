// discover.ts — find new article URLs from a source
// Priority: RSS feed -> listing page (cheerio) -> sitemap.xml
// پایگاه خبری راهکار جوان

import RSSParser from 'rss-parser'
import * as cheerio from 'cheerio'
import { fetchPage } from './fetchPage'
import { AggregatorSettings, DiscoveredItem, normalizeUrl } from './types'

const rssParser = new RSSParser({
  timeout: 15000,
  headers: { 'User-Agent': '' }, // filled in below
  customFields: { item: ['pubDate', 'dc:date'] },
})

export interface DiscoveryConfig {
  rssUrl?: string | null
  listingUrl?: string | null
  linkSelector?: string | null
  useSitemap?: boolean
  baseUrl?: string  // for resolving relative links
}

/** Discover article URLs according to the priority: rss -> listing -> sitemap. */
export async function discoverArticles(
  cfg: DiscoveryConfig,
  settings: AggregatorSettings,
  limit: number,
  respectRobots: boolean,
): Promise<DiscoveredItem[]> {
  if (cfg.rssUrl) {
    // If the user pasted a sitemap URL into the "RSS / discovery URL" field
  // (e.g. https://farsnews.ir/sitemaps/contents/2026/11/23/index001.xml),
  // treat it as a sitemap rather than an RSS feed. Many news sites (Fars,
  // IRNA, ...) don't expose RSS but do expose dated sitemaps.
    const lower = cfg.rssUrl.toLowerCase()
    if (lower.endsWith('.xml') || lower.includes('sitemap') || lower.includes('/sitemap')) {
      try {
        const items = await discoverFromSitemapUrl(cfg.rssUrl, settings, limit, respectRobots, cfg.linkSelector || undefined)
        if (items.length) return items
      } catch {
        // fall through to RSS
      }
    }
    // Fars News "showcase" pages: https://farsnews.ir/politics/showcase,
    // https://farsnews.ir/Nojavan/showcase, etc. These are HTML listing
    // pages where every article card links to /politics/news/... or
    // /Nojavan/news/... — so we treat them as listing pages with a default
    // link selector that targets any anchor whose href contains /news/.
    if (lower.includes('/showcase')) {
      try {
        const items = await discoverFromListing(
          {
            listingUrl: cfg.rssUrl,
            // If the admin set an explicit linkSelector, honor it; otherwise
            // default to "every anchor" and filter to /news/ links below.
            linkSelector: cfg.linkSelector || 'a[href*="/news/"]',
            baseUrl: cfg.baseUrl,
          },
          settings,
          limit,
          respectRobots,
        )
        if (items.length) return items
      } catch {
        // fall through to RSS
      }
    }
    try {
      const items = await discoverFromRss(cfg.rssUrl, settings, limit)
      if (items.length) return items
    } catch (e) {
      // fall through to listing
    }
  }
  if (cfg.listingUrl && cfg.linkSelector) {
    try {
      const items = await discoverFromListing(cfg, settings, limit, respectRobots)
      if (items.length) return items
    } catch (e) {
      // fall through to sitemap
    }
  }
  if (cfg.useSitemap && cfg.baseUrl) {
    try {
      return await discoverFromSitemap(cfg.baseUrl, settings, limit, respectRobots)
    } catch (e) {
      return []
    }
  }
  return []
}

// ---------- RSS / Atom ----------

async function discoverFromRss(
  feedUrl: string,
  settings: AggregatorSettings,
  limit: number,
): Promise<DiscoveredItem[]> {
  // Some Persian news sites reject unknown bots on their RSS endpoint, so use a
  // real browser UA here (RSS feeds are public documents and there is no honest
  // bot policy issue — we still respect robots.txt for the article pages).
  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  ;(rssParser as any).options.headers['User-Agent'] = ua
  const feed = await rssParser.parseURL(feedUrl)
  const items: DiscoveredItem[] = []
  for (const it of (feed.items || []).slice(0, limit)) {
    const url = it.link || it.guid
    if (!url) continue
    let publishedAt: Date | undefined
    const d = it.isoDate || (it as any).pubDate || (it as any)['dc:date']
    if (d) {
      const dt = new Date(d)
      if (!isNaN(dt.getTime())) publishedAt = dt
    }
    items.push({
      url: normalizeUrl(url),
      title: it.title?.trim() || undefined,
      publishedAt,
      category: Array.isArray(it.categories) && it.categories.length
        ? (it.categories[0] as any)?.['_'] || String(it.categories[0])
        : undefined,
    })
  }
  return items
}

// ---------- Listing page ----------

async function discoverFromListing(
  cfg: DiscoveryConfig,
  settings: AggregatorSettings,
  limit: number,
  respectRobots: boolean,
): Promise<DiscoveredItem[]> {
  if (!cfg.listingUrl || !cfg.linkSelector) return []
  const res = await fetchPage(cfg.listingUrl, settings, { respectRobots })
  if (!res.ok) return []
  const $ = cheerio.load(res.html)
  const baseUrl = cfg.listingUrl
  const items: DiscoveredItem[] = []
  const seen = new Set<string>()

  $(cfg.linkSelector).each((_, el) => {
    if (items.length >= limit) return false
    const $el = $(el)
    let href = $el.attr('href') || $el.find('a').first().attr('href') || ''
    if (!href) return
    const resolved = resolveUrl(href, baseUrl)
    if (!resolved) return
    const norm = normalizeUrl(resolved)
    if (seen.has(norm)) return
    seen.add(norm)
    const title = ($el.attr('title') || $el.text() || '').trim() || undefined
    items.push({ url: norm, title })
  })
  return items
}

// ---------- sitemap.xml / news-sitemap ----------

async function discoverFromSitemap(
  baseUrl: string,
  settings: AggregatorSettings,
  limit: number,
  respectRobots: boolean,
): Promise<DiscoveredItem[]> {
  const candidates = [
    new URL('/sitemap-news.xml', baseUrl).toString(),
    new URL('/sitemap.xml', baseUrl).toString(),
    new URL('/sitemap_index.xml', baseUrl).toString(),
    new URL('/news-sitemap.xml', baseUrl).toString(),
  ]
  for (const sm of candidates) {
    try {
      const res = await fetchPage(sm, settings, { respectRobots })
      if (!res.ok) continue
      const items = parseSitemap(res.html, sm, limit)
      if (items.length) return items
    } catch {
      continue
    }
  }
  return []
}

/**
 * Discover from an explicit sitemap URL the admin pasted. Handles nested
 * sitemap indexes: if the top document is a <sitemapindex>, dive into the
 * first child sitemaps (newest first, since they are listed newest-first by
 * most news sites) until we have `limit` article URLs. Supports an optional
 * `pathFilter` (substring match against the URL path) so a source can be
 * restricted to a category, e.g. "politics" or "nojavan".
 */
async function discoverFromSitemapUrl(
  sitemapUrl: string,
  settings: AggregatorSettings,
  limit: number,
  respectRobots: boolean,
  pathFilter?: string,
): Promise<DiscoveredItem[]> {
  const items: DiscoveredItem[] = []
  const seen = new Set<string>()
  // queue of sitemaps to fetch; start with the user-supplied one
  const queue: string[] = [sitemapUrl]
  let fetchedSitemaps = 0
  const MAX_SITEMAPS = 15  // safety cap; raised from 5 so multi-category
  // sitemaps (Fars) have enough child sitemaps scanned to find items for
  // less-frequent categories like /economic/ or /Nojavan/.

  while (queue.length && items.length < limit && fetchedSitemaps < MAX_SITEMAPS) {
    const url = queue.shift()!
    fetchedSitemaps++
    try {
      const res = await fetchPage(url, settings, { respectRobots })
      if (!res.ok) continue
      const $ = cheerio.load(res.html, { xml: true })
      // urlset → article URLs
      let foundUrls = 0
      $('url > loc').each((_, el) => {
        if (items.length >= limit) return false
        const v = $(el).text().trim()
        if (!v) return
        // optional path filter: keep only URLs whose path contains the filter
        // (case-insensitive). Lets the admin make a "Fars politics" source
        // that only imports /politics/... items.
        if (pathFilter) {
          try {
            const p = new URL(v).pathname.toLowerCase()
            if (!p.includes(pathFilter.toLowerCase())) return
          } catch { /* keep */ }
        }
        // Skip user-comment URLs on community-driven sites like farsnews.ir,
        // where sitemaps include user profiles/comment pages we don't want.
        if (/\/user\d/i.test(v) || /\/users?\//i.test(v)) return
        const norm = normalizeUrl(v)
        if (seen.has(norm)) return
        seen.add(norm)
        items.push({ url: norm })
        foundUrls++
      })
      // sitemapindex → enqueue child sitemaps (newest-first)
      const childSm: string[] = []
      $('sitemap > loc').each((_, el) => {
        const v = $(el).text().trim()
        if (v) childSm.push(v)
      })
      if (childSm.length && items.length < limit) {
        // children are typically listed newest-first; take a few
        for (const c of childSm.slice(0, 3)) queue.push(c)
      }
      if (foundUrls === 0 && childSm.length === 0) {
        // nothing useful here
        continue
      }
    } catch {
      continue
    }
  }
  return items
}

function parseSitemap(xml: string, sourceUrl: string, limit: number): DiscoveredItem[] {
  const $ = cheerio.load(xml, { xml: true })
  const items: DiscoveredItem[] = []
  // <urlset> / <sitemapindex>
  $('url > loc, sitemap > loc').each((_, el) => {
    if (items.length >= limit) return false
    const v = $(el).text().trim()
    if (v) items.push({ url: normalizeUrl(v) })
  })
  return items
}

// ---------- helpers ----------

export function resolveUrl(href: string, base: string): string | null {
  try {
    return new URL(href, base).toString()
  } catch {
    return null
  }
}
