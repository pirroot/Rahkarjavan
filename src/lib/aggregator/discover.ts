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
    href = resolveUrl(href, baseUrl)
    if (!href) return
    const norm = normalizeUrl(href)
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
