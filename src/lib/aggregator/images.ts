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
 * Walk an HTML body, download every <img src=...> to our storage, and rewrite the
 * src attribute to point to our copy. Returns the new HTML plus the cover image URL
 * (the first image that successfully downloads).
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
    if (!src) continue
    if (src.startsWith('data:')) continue // keep inline data-urls as-is
    const res = await downloadAndStoreImage(src, baseUrl, settings)
    if (res.ok && res.url) {
      if (!coverImage) coverImage = res.url
      $el.attr('src', res.url)
      // remove srcset (we replaced only the main src)
      $el.removeAttr('srcset')
      // lazy-load
      $el.attr('loading', 'lazy')
    } else {
      // drop the broken image
      $el.remove()
    }
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
