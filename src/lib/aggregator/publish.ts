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
 * Caller has already verified that at least one of (videoUrl, coverImage) is present.
 *
 * Routing:
 *   - article.videoUrl set AND settings.importVideos true → Video
 *   - otherwise (incl. when importVideos is false) → Article (the video URL is dropped)
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
  // article-only path (requires a cover image)
  if (!coverImage) {
    return { ok: false, published: false, error: 'no media (no image and no usable video)' }
  }
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

  let contentHtml = article.contentHtml
  if (source.addSourceCredit) {
    const credit = `<p class="source-credit" style="margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280;">منبع: ${escapeHtml(source.name)} — <a href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer nofollow">${escapeHtml(domainOf(article.url))}</a></p>`
    contentHtml = contentHtml + credit
  }

  const status = source.autoPublish ? 'PUBLISHED' : 'DRAFT'
  const isPublished = source.autoPublish
  const title = (article.title || '').slice(0, 500)
  const excerpt = (article.excerpt || '').slice(0, 500)

  try {
    const created = await db.article.create({
      data: {
        title,
        slug,
        excerpt,
        content: contentHtml,
        coverImage: coverImage || '',
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
        ogImage: coverImage || null,
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

// keep type re-export for orchestrator
export type { Prisma }
