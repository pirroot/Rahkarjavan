// extract.ts — extract title, body, image, date from an article HTML page
// Uses source-specific selectors when available, falls back to @mozilla/readability
// پایگاه خبری راهکار جوان

import * as cheerio from 'cheerio'
import { Readability } from '@mozilla/readability'
import { JSDOM } from 'jsdom'
import { fetchPage } from './fetchPage'
import { AggregatorSettings, ExtractedArticle } from './types'

export interface ExtractorSelectors {
  titleSelector?: string | null
  bodySelector?: string | null
  imageSelector?: string | null
  dateSelector?: string | null
  categorySelector?: string | null
  removeSelectors?: string[]    // CSS selectors to strip from the body
}

/** Fetch + extract an article. Returns null if content too short. */
export async function extractArticle(
  url: string,
  selectors: ExtractorSelectors,
  settings: AggregatorSettings,
  respectRobots: boolean,
): Promise<ExtractedArticle | null> {
  const res = await fetchPage(url, settings, { respectRobots })
  if (!res.ok) throw new Error(`fetch failed: HTTP ${res.status}`)

  const $ = cheerio.load(res.html)

  // ---- Video (embedded) ----
  // We must extract video BEFORE stripping <iframe> and <meta> below, because
  // YouTube/Aparat/Vimeo embeds live in <iframe> and og:video lives in <meta>.
  const videoInfo = extractVideo($, res.finalUrl)
  const videoUrl = videoInfo?.url
  const videoHost = videoInfo?.host

  // strip script/style/etc up-front (now safe — we've already captured the video)
  $('script,style,noscript,iframe,form,button,svg,link,meta').remove()

  // ---- Title ----
  let title = ''
  if (selectors.titleSelector) {
    const el = $(selectors.titleSelector).first()
    title = cleanText(el.text()) || cleanText(el.attr('content') || '')
  }
  if (!title) {
    title = cleanText($('meta[property="og:title"]').attr('content') || '')
      || cleanText($('h1').first().text())
      || cleanText($('title').text())
  }

  // ---- Body HTML ----
  let bodyHtml = ''
  let rawText = ''
  if (selectors.bodySelector) {
    const el = $(selectors.bodySelector).first().clone()
    // strip removeSelectors within the body
    if (selectors.removeSelectors && selectors.removeSelectors.length) {
      for (const r of selectors.removeSelectors) {
        try { el.find(r).remove() } catch {}
      }
    }
    // strip noise tags
    el.find('script,style,noscript,iframe,form,button,aside,.related,.share,.social,.ads,.advertise,.newsletter,.comments,[role="complementary"]').remove()
    bodyHtml = el.html() || ''
    rawText = cleanText(el.text())
  }
  if (!rawText || rawText.length < settings.minContentLength) {
    // fall back to Readability
    const dom = new JSDOM(res.html, { url })
    const reader = new Readability(dom.window.document, {
      charThreshold: settings.minContentLength,
    })
    const article = reader.parse()
    if (article) {
      if (!title) title = article.title || ''
      bodyHtml = article.content || ''
      rawText = cleanText(article.textContent || '')
    }
  }
  if (!rawText || rawText.length < settings.minContentLength) {
    return null
  }
  if (!title) return null

  // ---- Cover image ----
  let coverImage: string | undefined
  if (selectors.imageSelector) {
    const el = $(selectors.imageSelector).first()
    coverImage = el.attr('src') || el.attr('data-src') || el.attr('content') || undefined
  }
  if (!coverImage) {
    coverImage = $('meta[property="og:image"]').attr('content') || undefined
  }
  if (!coverImage) {
    coverImage = $('article img, .article img').first().attr('src') || undefined
  }
  if (coverImage) coverImage = resolveUrl(coverImage, res.finalUrl)

  // ---- Date ----
  let publishedAt: Date | undefined
  if (selectors.dateSelector) {
    const el = $(selectors.dateSelector).first()
    const dt = el.attr('datetime') || el.attr('content') || el.text()
    if (dt) {
      const d = new Date(cleanText(dt))
      if (!isNaN(d.getTime())) publishedAt = d
    }
  }
  if (!publishedAt) {
    const dt = $('meta[property="article:published_time"]').attr('content')
      || $('time[datetime]').first().attr('datetime')
    if (dt) {
      const d = new Date(dt)
      if (!isNaN(d.getTime())) publishedAt = d
    }
  }

  // ---- Category ----
  let category: string | undefined
  if (selectors.categorySelector) {
    category = cleanText($(selectors.categorySelector).first().text()) || undefined
  }
  if (!category) {
    category = $('meta[property="article:section"]').attr('content') || undefined
  }

  // ---- Excerpt ----
  let excerpt = cleanText($('meta[name="description"], meta[property="og:description"]').first().attr('content') || '')
  if (!excerpt) {
    excerpt = rawText.slice(0, 200).trim() + (rawText.length > 200 ? '…' : '')
  }

  // ---- Author ----
  const author = $('meta[name="author"], meta[property="article:author"]').first().attr('content') || undefined

  return {
    url,
    title: title.slice(0, 500),
    excerpt: excerpt.slice(0, 500),
    contentHtml: bodyHtml,
    coverImage,
    videoUrl,
    videoHost,
    publishedAt,
    category,
    author,
  }
}

function cleanText(s: string): string {
  return s.replace(/\s+/g, ' ').replace(/\u200c/g, '\u200c').trim()
}

function resolveUrl(src: string, base: string): string {
  try {
    return new URL(src, base).toString()
  } catch {
    return src
  }
}

/**
 * Extract the first usable embedded video URL from the page.
 * Priority:
 *   1. <meta property="og:video" content="...">  (also og:video:url, og:video:secure_url)
 *   2. <video src="..."> or <video><source src="...">
 *   3. <iframe src="..."> (YouTube / Aparat / Vimeo / direct mp4 in iframe)
 * Returns the absolute URL plus a host label, or undefined when no video is found.
 */
function extractVideo($: cheerio.CheerioAPI, base: string): { url: string; host: 'youtube' | 'aparat' | 'vimeo' | 'direct' | 'other' } | undefined {
  // 1) Open Graph video meta tags
  const ogSources = [
    $('meta[property="og:video:secure_url"]').attr('content'),
    $('meta[property="og:video:url"]').attr('content'),
    $('meta[property="og:video"]').attr('content'),
  ].filter(Boolean) as string[]
  for (const src of ogSources) {
    const v = classifyVideo(src, base)
    if (v) return v
  }

  // 2) <video> element
  const videoEl = $('video').first()
  if (videoEl.length) {
    const src = videoEl.attr('src') || videoEl.find('source').first().attr('src')
    if (src) {
      const v = classifyVideo(src, base)
      if (v) return v
    }
  }

  // 3) <iframe> (embedded players)
  const iframes = $('iframe').toArray()
  for (const el of iframes) {
    const src = $(el).attr('src')
    if (!src) continue
    // only consider iframes that look like video embeds
    const lower = src.toLowerCase()
    if (
      lower.includes('youtube.com') || lower.includes('youtu.be') ||
      lower.includes('aparat.com') || lower.includes('aparat/') ||
      lower.includes('vimeo.com') ||
      lower.endsWith('.mp4') || lower.includes('.mp4?')
    ) {
      const v = classifyVideo(src, base)
      if (v) return v
    }
  }
  return undefined
}

/** Resolve, validate and classify a candidate video URL. */
function classifyVideo(src: string, base: string): { url: string; host: 'youtube' | 'aparat' | 'vimeo' | 'direct' | 'other' } | undefined {
  let abs: string
  try {
    abs = new URL(src, base).toString()
  } catch {
    return undefined
  }
  const u = new URL(abs)
  const h = u.hostname.toLowerCase()
  if (h.includes('youtube.com') || h.includes('youtu.be')) {
    return { url: abs, host: 'youtube' }
  }
  if (h.includes('aparat.com') || h.includes('aparat')) {
    return { url: abs, host: 'aparat' }
  }
  if (h.includes('vimeo.com')) {
    return { url: abs, host: 'vimeo' }
  }
  // direct mp4 (anywhere)
  if (abs.toLowerCase().endsWith('.mp4') || abs.toLowerCase().includes('.mp4?')) {
    return { url: abs, host: 'direct' }
  }
  // other — return as-is so the admin can review, but only if it has a video-ish path
  if (u.pathname.toLowerCase().match(/\.(mp4|webm|mov|m3u8)(\?|$)/)) {
    return { url: abs, host: 'direct' }
  }
  return undefined
}

