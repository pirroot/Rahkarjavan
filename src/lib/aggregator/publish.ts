// publish.ts — create the Article or Video record from the processed extracted content
// پایگاه خبری راهکار جوان
//
// Routing rule:
//   - article has a video URL  → save as Video
//   - article has a cover image but no video  → save as Article (magazine)
//   - article has neither  → caller must reject (we don't save media-less items)

import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import {
  AggregatorSettings, ExtractedArticle, makeSlug, normalizeUrl, titleHash,
} from './types'

interface PublishInput {
  source: {
    id: string
    name: string
    autoPublish: boolean       // for Articles
    autoPublishVideo: boolean  // for Videos
    useOriginalDate: boolean
    addSourceCredit: boolean
    defaultCategoryId: string | null
    videoCategoryId: string | null
    categoryMap: string  // JSON string: { "source-cat": "site-category-id" }
  }
  article: ExtractedArticle  // post-cleaning and post-replace
  coverImage: string | undefined
}

export interface PublishResult {
  ok: boolean
  kind?: 'article' | 'video'
  articleId?: string
  videoId?: string
  slug?: string
  published: boolean
  error?: string
}

/**
 * Decide whether to save as Video or Article and dispatch.
 *
 * Routing:
 *   - article.videoUrl set AND settings.importVideos true → Video
 *   - otherwise (incl. when importVideos is false) → Article
 *
 * The caller already decided whether a cover image is required (it is NOT
 * required when settings.importImages is off — text-only mode).
 */
export async function publishArticle(
  input: PublishInput,
  settings: AggregatorSettings,
): Promise<PublishResult> {
  const { source, article, coverImage } = input

  // ---- Routing ----
  if (article.videoUrl && settings.importVideos && (source.videoCategoryId || source.defaultCategoryId)) {
    return publishVideo(input, settings)
  }
  // Article path. coverImage may be empty in text-only mode (settings.importImages=false).
  return publishMagazineArticle(input, settings)
}

// ---------- Article (magazine) ----------

async function publishMagazineArticle(
  input: PublishInput,
  settings: AggregatorSettings,
): Promise<PublishResult> {
  const { source, article, coverImage } = input
  // Category mapping
  let categoryId = source.defaultCategoryId || null
  if (article.category) {
    try {
      const map = JSON.parse(source.categoryMap || '{}') as Record<string, string>
      if (map[article.category]) categoryId = map[article.category]
    } catch { /* keep default */ }
  }

  const slug = await uniqueArticleSlug(article.title)
  const publishedAt = (source.useOriginalDate && article.publishedAt) || new Date()

  // ---- Source attribution formatting ----
  // The client asked: "اول اون متن نوشته بشه فارس. فارس دو نقطه" — prepend the
  // source's short name as a byline at the very top of the body. The short
  // name is the first word of source.name (e.g. "خبرگزاری فارس" → "فارس").
  // Then keep the body text exactly as-is (copy/paste of the original).
  // Finally append a "منبع: <name> — <link>" footer.
  const shortSource = shortSourceName(source.name)
  let contentHtml = article.contentHtml
  if (source.addSourceCredit) {
    // prepend byline: <p><strong>فارس:</strong> ...body...</p>
    // We wrap the existing body so the byline is the very first thing the
    // reader sees.
    const byline = `<p style="margin-bottom:12px;font-weight:700;color:#dc2626;font-size:1.05em;">${escapeHtml(shortSource)}:</p>`
    const credit = `<p class="source-credit" style="margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280;">منبع: ${escapeHtml(source.name)} — <a href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer nofollow">${escapeHtml(domainOf(article.url))}</a></p>`
    contentHtml = byline + contentHtml + credit
  }

  // Use the source short name as the excerpt lead when no excerpt was extracted.
  const rawExcerpt = (article.excerpt || '').slice(0, 500)
  const excerpt = rawExcerpt || `${shortSource}: ` + cleanText(article.contentHtml || '').slice(0, 180)

  const status = source.autoPublish ? 'PUBLISHED' : 'DRAFT'
  const isPublished = source.autoPublish
  const title = (article.title || '').slice(0, 500)

  // coverImage may be empty in text-only mode (settings.importImages=false).
  const finalCover = coverImage || ''

  try {
    const created = await db.article.create({
      data: {
        title,
        slug,
        excerpt,
        content: contentHtml,
        coverImage: finalCover,
        categoryId,
        authorId: null,
        tags: article.category || '',
        status: status as any,
        isPublished,
        publishedAt: isPublished ? publishedAt : null,
        sourceUrl: normalizeUrl(article.url),
        sourceId: source.id,
        sourceName: source.name,
        sourcePublishedAt: article.publishedAt || null,
        titleHash: titleHash(title),
        isAutoImported: true,
        metaTitle: title.slice(0, 60),
        metaDescription: excerpt.slice(0, 160),
        ogImage: finalCover || null,
      },
    })
    return { ok: true, kind: 'article', articleId: created.id, slug: created.slug, published: isPublished }
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return { ok: false, published: false, error: 'duplicate (unique constraint)' }
    }
    return { ok: false, published: false, error: e?.message || 'save failed' }
  }
}

// ---------- Video ----------

async function publishVideo(
  input: PublishInput,
  settings: AggregatorSettings,
): Promise<PublishResult> {
  const { source, article, coverImage } = input
  if (!article.videoUrl) {
    return { ok: false, published: false, error: 'video missing url' }
  }
  // Cover image is required for videos too — if missing, we still save but with
  // a placeholder the admin can replace later. (This is a routing decision: a video
  // without a cover is still a video, not a magazine article.)
  const finalCover = coverImage || ''
  const categoryId = source.videoCategoryId || source.defaultCategoryId || null

  const slug = await uniqueVideoSlug(article.title)
  const publishedAt = (source.useOriginalDate && article.publishedAt) || new Date()

  // Description: use excerpt + source credit
  let description = article.excerpt || ''
  if (source.addSourceCredit) {
    const credit = `<p class="source-credit" style="margin-top:16px;font-size:13px;color:#6b7280;">منبع: ${escapeHtml(source.name)} — <a href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer nofollow">${escapeHtml(domainOf(article.url))}</a></p>`
    description = description + credit
  }

  const isPublished = source.autoPublishVideo
  const title = (article.title || '').slice(0, 500)

  // If the video is an embed (YouTube/Aparat/Vimeo), store the embed URL as videoUrl;
  // if it's a direct mp4, store the direct URL. duration is unknown for embeds —
  // leave it empty and let the player handle it.
  const videoUrlForStorage = article.videoUrl
  const host = article.videoHost || 'other'
  const embedUrl = toEmbedUrl(videoUrlForStorage, host) || videoUrlForStorage

  try {
    const created = await db.video.create({
      data: {
        title,
        slug,
        description: description.slice(0, 5000),
        coverImage: finalCover,
        videoUrl: embedUrl,
        duration: '00:00',
        isPublished,
        videoType: 'NEWS',
        sourceName: source.name,
        sourceUrl: article.url,
        categoryId,
        // SEO
        metaTitle: title.slice(0, 60),
        metaDescription: (article.excerpt || '').slice(0, 160),
        ogImage: finalCover || null,
      },
    })
    // mark the original URL as "imported" by writing a stub Article row with the
    // sourceUrl so the dedup check (which only looks at Article.sourceUrl) skips it
    // on the next run.
    try {
      await db.article.create({
        data: {
          title: '[video] ' + title,
          slug: slug + '-video-stub',
          excerpt: '',
          content: '',
          coverImage: '',
          tags: '',
          isPublished: false,
          status: 'DRAFT',
          sourceUrl: normalizeUrl(article.url),
          sourceId: source.id,
          sourceName: source.name,
          sourcePublishedAt: article.publishedAt || null,
          titleHash: titleHash(title),
          isAutoImported: true,
        },
      })
    } catch { /* duplicate stub is fine */ }
    return { ok: true, kind: 'video', videoId: created.id, slug: created.slug, published: isPublished }
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return { ok: false, published: false, error: 'duplicate (unique constraint)' }
    }
    return { ok: false, published: false, error: e?.message || 'video save failed' }
  }
}

/** Convert a watch URL (e.g. youtube.com/watch?v=ID) into an embeddable URL. */
function toEmbedUrl(url: string, host: string): string | null {
  try {
    const u = new URL(url)
    if (host === 'youtube') {
      // watch?v=ID  →  /embed/ID
      const id = u.searchParams.get('v')
      if (id) return `https://www.youtube.com/embed/${id}`
      // youtu.be/ID  →  /embed/ID
      if (u.hostname === 'youtu.be' && u.pathname) {
        return `https://www.youtube.com/embed${u.pathname}`
      }
      // already an embed URL
      if (u.pathname.startsWith('/embed/')) return url
      return url
    }
    if (host === 'aparat') {
      // https://www.aparat.com/v/XXXXXXXX  →  https://www.aparat.com/video/video/embed/videohash/XXXXXXXX
      const m = /\/v\/([a-zA-Z0-9_-]+)/.exec(u.pathname)
      if (m) return `https://www.aparat.com/video/video/embed/videohash/${m[1]}`
      return url
    }
    if (host === 'vimeo') {
      // https://vimeo.com/ID  →  https://player.vimeo.com/video/ID
      const m = /^\/(\d+)/.exec(u.pathname)
      if (m) return `https://player.vimeo.com/video/${m[1]}`
      return url
    }
    return url
  } catch {
    return null
  }
}

// ---------- Helpers ----------

async function uniqueArticleSlug(title: string): Promise<string> {
  let slug = makeSlug(title)
  let suffix = 2
  let unique = slug
  while (await db.article.findUnique({ where: { slug: unique }, select: { id: true } })) {
    unique = `${slug}-${suffix++}`
  }
  return unique
}

async function uniqueVideoSlug(title: string): Promise<string> {
  let slug = makeSlug(title)
  // Video slugs share the same global namespace as Article slugs? No — Video.slug
  // is its own unique constraint, but to keep URLs readable we still avoid clashes
  // with Article slugs.
  let suffix = 2
  let unique = slug
  while (
    await db.video.findUnique({ where: { slug: unique }, select: { id: true } }) ||
    await db.article.findUnique({ where: { slug: unique }, select: { id: true } })
  ) {
    unique = `${slug}-${suffix++}`
  }
  return unique
}

/** Check if an article URL or normalized title was already imported. */
export async function alreadyImported(normalizedUrl: string, hash: string): Promise<boolean> {
  const existing = await db.article.findFirst({
    where: {
      OR: [
        { sourceUrl: normalizedUrl },
        { titleHash: hash, isAutoImported: true },
      ],
    },
    select: { id: true },
  })
  return !!existing
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function domainOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

/** Extract a short byline name from a full source name.
 * Examples:
 *   "خبرگزاری فارس" → "فارس"
 *   "خبرگزاری تسنیم" → "تسنیم"
 *   "ایسنا" → "ایسنا"
 *   "Fars News Agency" → "Fars"
 * Falls back to the last whitespace-separated word.
 */
function shortSourceName(full: string): string {
  const trimmed = (full || '').trim()
  if (!trimmed) return 'منبع'
  // Persian common prefixes to drop
  const drop = ['خبرگزاری', 'خبرگزاري', 'نشریه', 'پایگاه', 'سایت', 'website', 'news']
  const words = trimmed.split(/\s+/).filter(Boolean)
  const remaining = words.filter((w) => !drop.includes(w.toLowerCase()))
  if (remaining.length) {
    // last surviving word is usually the brand ("فارس", "تسنیم")
    return remaining[remaining.length - 1]
  }
  return words[words.length - 1] || trimmed
}

/** Plain-text strip of HTML tags (for excerpt fallback). */
function cleanText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// keep type re-export for orchestrator
export type { Prisma }
