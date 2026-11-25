// News Aggregator - shared types and global settings
// پایگاه خبری راهکار جوان — rule-based, no AI

import { db } from '@/lib/db'
import { createHash } from 'crypto'
import slugify from 'slugify'

// ---------- Global settings ----------

const DEFAULTS = {
  siteName: 'راهکار جوان',
  minContentLength: 200,        // min body length (chars)
  requestDelayMs: 1500,         // delay between requests to the same source
  fetchTimeoutMs: 15000,
  fetchRetries: 2,
  userAgent: 'RahkarJavanNewsBot/1.0 (+https://rahkarjavan.ir)',
  maxConsecutiveFailures: 5,
  autoDisableHours: 3,           // auto-disabled source stays off for 3h
  defaultIntervalMinutes: 20,
  defaultMaxItemsPerRun: 20,
  // Media routing — global switch. When false, pages that contain a video are
  // imported as plain articles (the video URL is ignored). When true, video
  // pages are saved into the Video table via publishVideo.
  importVideos: false,
  // Image importing — when true (default), the aggregator downloads the
  // original cover image and in-body images and re-hosts them on our server.
  // When false, NO image is downloaded: the article is saved as text-only
  // (coverImage = empty, in-body <img> tags stripped). This is what the
  // client asked for aggregated news: "تصویرش اصلاً نیاد، فقط متنش بیاد" to
  // avoid any copyright issue with republishing other agencies' photos.
  importImages: true,
  // Latest-only mode — when true, the aggregator imports only the newest items
  // from each source per run (respects maxItemsPerRun but skips items older
  // than the source's last successful import). This keeps the front-page
  // "آخرین خبرها" ticker fresh without pulling the entire archive.
  latestOnly: true,
}

export type AggregatorSettings = typeof DEFAULTS

export async function getAggregatorSettings(): Promise<AggregatorSettings> {
  const rows = await db.siteSetting.findMany({
    where: { key: { startsWith: 'agg_' } },
  })
  const map = new Map(rows.map((r) => [r.key, r.value]))
  const get = <K extends keyof AggregatorSettings>(
    key: string,
    fallback: AggregatorSettings[K],
    coerce: (v: string) => AggregatorSettings[K],
  ): AggregatorSettings[K] => {
    const v = map.get(key)
    if (v == null || v === '') return fallback
    try { return coerce(v) } catch { return fallback }
  }
  return {
    siteName: get('agg_site_name', DEFAULTS.siteName, (v) => v as string),
    minContentLength: get('agg_min_content_length', DEFAULTS.minContentLength, (v) => parseInt(v, 10)),
    requestDelayMs: get('agg_request_delay_ms', DEFAULTS.requestDelayMs, (v) => parseInt(v, 10)),
    fetchTimeoutMs: get('agg_fetch_timeout_ms', DEFAULTS.fetchTimeoutMs, (v) => parseInt(v, 10)),
    fetchRetries: get('agg_fetch_retries', DEFAULTS.fetchRetries, (v) => parseInt(v, 10)),
    userAgent: get('agg_user_agent', DEFAULTS.userAgent, (v) => v as string),
    maxConsecutiveFailures: get('agg_max_failures', DEFAULTS.maxConsecutiveFailures, (v) => parseInt(v, 10)),
    autoDisableHours: get('agg_auto_disable_hours', DEFAULTS.autoDisableHours, (v) => parseInt(v, 10)),
    defaultIntervalMinutes: get('agg_default_interval', DEFAULTS.defaultIntervalMinutes, (v) => parseInt(v, 10)),
    defaultMaxItemsPerRun: get('agg_default_max_items', DEFAULTS.defaultMaxItemsPerRun, (v) => parseInt(v, 10)),
    importVideos: get('agg_import_videos', DEFAULTS.importVideos, (v) => v === '1' || v === 'true'),
    importImages: get('agg_import_images', DEFAULTS.importImages, (v) => v === '1' || v === 'true'),
    latestOnly: get('agg_latest_only', DEFAULTS.latestOnly, (v) => v === '1' || v === 'true'),
  }
}

export async function setAggregatorSettings(patch: Partial<AggregatorSettings>) {
  const keyMap: Record<keyof AggregatorSettings, string> = {
    siteName: 'agg_site_name',
    minContentLength: 'agg_min_content_length',
    requestDelayMs: 'agg_request_delay_ms',
    fetchTimeoutMs: 'agg_fetch_timeout_ms',
    fetchRetries: 'agg_fetch_retries',
    userAgent: 'agg_user_agent',
    maxConsecutiveFailures: 'agg_max_failures',
    autoDisableHours: 'agg_auto_disable_hours',
    defaultIntervalMinutes: 'agg_default_interval',
    defaultMaxItemsPerRun: 'agg_default_max_items',
    importVideos: 'agg_import_videos',
    importImages: 'agg_import_images',
    latestOnly: 'agg_latest_only',
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v == null) continue
    const key = keyMap[k as keyof AggregatorSettings]
    await db.siteSetting.upsert({
      where: { key },
      create: { key, value: String(v) },
      update: { value: String(v) },
    })
  }
}

// ---------- Types ----------

export interface DiscoveredItem {
  url: string          // absolute URL of the article page
  title?: string      // from RSS title or link text
  publishedAt?: Date   // from RSS pubDate
  category?: string    // from RSS category or detected on listing
}

export interface ExtractedArticle {
  url: string
  title: string
  excerpt: string
  contentHtml: string  // cleaned, sanitized HTML
  coverImage?: string  // absolute URL of the original image
  videoUrl?: string    // absolute URL of an embedded video (mp4 or YouTube/Aparat/Vimeo embed)
  videoHost?: string   // "youtube" | "aparat" | "vimeo" | "direct" | "other"
  publishedAt?: Date
  category?: string
  author?: string
  /** True when the body came from <meta og:description> (SPA lead-paragraph mode).
   *  In this mode the body is intentionally short (one lead paragraph), so
   *  callers should accept it even if shorter than the global minContentLength. */
  isOgFallback?: boolean
}

export interface SourceRunResult {
  sourceId: string
  sourceName: string
  found: number
  created: number
  published: number
  skipped: number
  failed: number
  errors: { url: string; error: string }[]
  status: 'OK' | 'FAILED' | 'SKIPPED'
  durationMs: number
}

// Parse a JSON array field that we stored as a String (SQLite has no native list type)
export function parseStringArray(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v.map((x) => String(x)) : []
  } catch {
    return []
  }
}

// Parse a JSON object field
export function parseStringObject<T = Record<string, any>>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

// ---------- URL normalization ----------

/**
 * Normalize a URL for deduplication:
 *  - lowercase host
 *  - strip utm_* and fbclid, gclid query params
 *  - strip trailing slash
 *  - strip hash fragment
 */
export function normalizeUrl(input: string): string {
  let u: URL
  try {
    u = new URL(input)
  } catch {
    return input.trim()
  }
  u.protocol = u.protocol.toLowerCase()
  u.hostname = u.hostname.toLowerCase()
  // strip noise params
  const drop = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term',
                'utm_content', 'fbclid', 'gclid', 'mc_cid', 'mc_eid']
  for (const k of [...drop]) u.searchParams.delete(k)
  // drop query entirely if empty
  let s = u.protocol + '//' + u.host + u.pathname + (u.search || '')
  // strip trailing slash (except root)
  if (s.length > 1 && s.endsWith('/')) s = s.slice(0, -1)
  return s
}

/** SHA1 hash of a normalized title (secondary dedup key) */
export function titleHash(title: string): string {
  const normalized = title
    .replace(/\s+/g, ' ')
    .replace(/[«»"'\.،,!؟?\-—()]/g, '')
    .trim()
    .toLowerCase()
  return createHash('sha1').update(normalized, 'utf8').digest('hex')
}

/** Convert any title to a URL-safe slug (Persian-aware via slugify + transliteration fallback) */
export function makeSlug(title: string): string {
  // slugify handles latin + diacritics; for Persian it keeps the characters
  let s = slugify(title, { lower: true, strict: true, locale: 'fa' })
  if (!s) {
    // fallback for pure-Persian titles: hash the title so the slug is still unique & url-safe
    s = 'n-' + titleHash(title).slice(0, 12)
  }
  return s.slice(0, 80)
}
