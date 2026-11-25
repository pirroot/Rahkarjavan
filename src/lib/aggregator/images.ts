// images.ts — download cover and in-body images, re-host on our server
// پایگاه خبری راهکار جوان

import * as cheerio from 'cheerio'
import { uploadFile } from '@/lib/storage'
import { fetchPage } from './fetchPage'
import { AggregatorSettings } from './types'
import { resolveUrl } from './discover'

const IMAGE_TIMEOUT_MS = 20000
const MAX_IMAGE_BYTES = 10 * 1024 * 1024 // 10 MB

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png', gif: 'image/gif',
  webp: 'image/webp', svg: 'image/svg+xml',
  avif: 'image/avif',
}

export interface DownloadResult {
  ok: boolean
  url?: string
  error?: string
}

/**
 * Download an image from src and store it under /articles/aggregator/
 * Returns our public URL on success.
 */
export async function downloadAndStoreImage(
  src: string,
  base: string,
  settings: AggregatorSettings,
): Promise<DownloadResult> {
  const abs = resolveUrl(src, base)
  if (!abs) return { ok: false, error: 'invalid url' }
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), IMAGE_TIMEOUT_MS)
    const res = await fetch(abs, {
      headers: { 'User-Agent': settings.userAgent, 'Accept': 'image/*' },
      signal: ctrl.signal,
      redirect: 'follow',
    })
    clearTimeout(t)
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      return { ok: false, error: `not an image: ${contentType}` }
    }
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length === 0) return { ok: false, error: 'empty image' }
    if (buf.length > MAX_IMAGE_BYTES) return { ok: false, error: 'too large' }

    const ext = pickExtension(abs, contentType)
    const filename = `img${ext}`
    const result = await uploadFile(buf, filename, 'articles/aggregator', contentType)
    return { ok: true, url: result.url }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'download failed' }
  }
}

/**
 * Walk an HTML body and resolve every <img src=...> to its absolute URL on the
 * SOURCE server. We do NOT download or re-host the images — we just keep the
 * original URL so the source server keeps serving the bytes and our disk stays
 * empty. This is what the client asked for ("عکس رو از منبع نشون بده، روی هاست
 * ما ذخیره نکن").
 *
 * Returns the new HTML plus the cover image URL (the first usable image's
 * absolute URL). Broken images (data: URIs, empty src) are removed.
 */
export async function rehostImages(
  html: string,
  baseUrl: string,
  settings: AggregatorSettings,
): Promise<{ html: string; coverImage?: string }> {
  const $ = cheerio.load(html)
  let coverImage: string | undefined
  const imgs = $('img').toArray()
  for (const el of imgs) {
    const $el = $(el)
    const src = $el.attr('src') || $el.attr('data-src') || ''
    if (!src) { $el.remove(); continue }
    if (src.startsWith('data:')) { $el.remove(); continue }
    const abs = resolveUrl(src, baseUrl)
    if (!abs) { $el.remove(); continue }
    // Keep the original URL — the source server keeps serving the bytes.
    $el.attr('src', abs)
    $el.removeAttr('srcset')
    $el.attr('loading', 'lazy')
    $el.attr('referrerpolicy', 'no-referrer')
    if (!coverImage) coverImage = abs
  }
  return { html: $.html(), coverImage }
}

function pickExtension(url: string, contentType: string): string {
  const m = /\.(jpe?g|png|gif|webp|svg|avif)(\?|$)/i.exec(url)
  if (m) return '.' + m[1].toLowerCase()
  const sub = contentType.split('/')[1]?.split(';')[0]
  if (sub && MIME_BY_EXT[sub.toLowerCase()]) return '.' + sub.toLowerCase()
  return '.jpg'
}

/**
 * Branded fallback cover generator — DISABLED.
 *
 * The client asked us NOT to save any image on our server (whether downloaded
 * from the source or generated locally), to keep the disk light on a 8GB VPS.
 * The frontend (VisualMediaHome + ArticleCard) already renders a deterministic
 * branded gradient placeholder when coverImage is empty, so there is no need
 * to render anything on the server. We return null and let the caller save
 * the article with an empty coverImage.
 */
export async function generateCategoryCover(_opts: {
  categoryName?: string | null
  categoryColor?: string | null
  sourceName?: string | null
  title?: string
}): Promise<string | null> {
  return null
}

function escapeXml(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
