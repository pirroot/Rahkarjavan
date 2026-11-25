// seo.ts — server-side helpers to read SEO settings from the database and
// assemble Next.js Metadata objects for the layout, articles, videos, and
// category pages.
//
// We deliberately avoid caching the settings rows so changes from the admin
// panel are reflected on the next page render (Next.js already deduplicates
// fetches inside a single request).

import { db } from '@/lib/db'
import type { Metadata } from 'next'

export const DEFAULT_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://rahkarjavan.ir'

/** Read all `seo_*` settings into a key->value map. */
export async function getSeoSettings(): Promise<Record<string, string>> {
  const rows = await db.siteSetting.findMany({ where: { key: { startsWith: 'seo_' } } })
  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value
  return map
}

/** Convenience: read brand settings (site name / logo / etc.) too. */
export async function getBrandSettings(): Promise<Record<string, string>> {
  const rows = await db.siteSetting.findMany()
  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value
  return map
}

/**
 * Build the global Metadata object for app/layout.tsx. Merges the
 * admin-configured SEO settings with sane defaults so the site always has
 * correct title/description/OG/Twitter even before the admin opens the SEO
 * panel. Per-page metadata (article, video, category) overrides these via
 * `generateMetadata`.
 */
export async function buildGlobalMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings()
  const brand = await getBrandSettings()

  const siteName = brand.site_name || 'راهکار جوان'
  const siteNameEn = brand.site_name_en || 'Rahkar Javan'
  const title = seo.seo_site_title || `${siteName} | رسانه تصویری و مجله خبری`
  const description =
    seo.seo_site_description ||
    'پایگاه خبری راهکار جوان، رسانه‌ای مستقل با تمرکز بر اخبار و مسائل جوانان ایران و جهان.'
  const keywords = seo.seo_site_keywords
    ? seo.seo_site_keywords.split(',').map((k) => k.trim()).filter(Boolean)
    : ['راهکار جوان', 'اخبار جوانان', 'رسانه تصویری', 'مجله خبری', 'اخبار ایران']

  const canonical = seo.seo_canonical_url || DEFAULT_SITE_URL
  const robots = (seo.seo_robots || 'index, follow').split(',').map((s) => s.trim()).filter(Boolean)
  const ogImage = seo.seo_default_og_image || brand.logo_url || undefined
  const ogSiteName = seo.seo_og_site_name || siteName
  const ogLocale = seo.seo_og_locale || 'fa_IR'
  const ogType = seo.seo_og_type || 'website'

  const twitterCard = (seo.seo_twitter_card as 'summary' | 'summary_large_image' | 'player' | 'app') || 'summary_large_image'
  const twitterSite = seo.seo_twitter_site || undefined
  const twitterCreator = seo.seo_twitter_creator || undefined

  const metadata: Metadata = {
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description,
    keywords,
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    metadataBase: new URL(DEFAULT_SITE_URL),
    alternates: { canonical },
    robots: {
      index: robots.includes('index') || robots.includes('all'),
      follow: robots.includes('follow') || robots.includes('all'),
      googleBot: {
        index: robots.includes('index') || robots.includes('all'),
        follow: robots.includes('follow') || robots.includes('all'),
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: ogSiteName,
      locale: ogLocale,
      type: ogType as any,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: siteName }] : undefined,
    },
    twitter: {
      card: twitterCard,
      site: twitterSite,
      creator: twitterCreator,
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    icons: {
      icon: brand.favicon_url ? [{ url: brand.favicon_url }] : [{ url: '/icon.svg', type: 'image/svg+xml' }],
    },
  }

  // English site name for the lang="en" view, attached as applicationName
  ;(metadata as any).applicationName = siteNameEn
  return metadata
}

/**
 * Build per-article metadata. Merges the article's own metaTitle/metaDescription
 * (set in the editor) with the global OG/Twitter defaults. Falls back to the
 * article title/excerpt when no SEO override was set.
 */
export async function buildArticleMetadata(article: {
  title: string
  slug: string
  excerpt?: string | null
  coverImage?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  ogImage?: string | null
  publishedAt?: Date | null
  updatedAt?: Date
  category?: { name?: string | null } | null
}): Promise<Metadata> {
  const seo = await getSeoSettings()
  const brand = await getBrandSettings()
  const siteName = brand.site_name || 'راهکار جوان'

  const title = article.metaTitle || article.title
  const description = (article.metaDescription || article.excerpt || '').slice(0, 160)
  const ogImage = article.ogImage || article.coverImage || seo.seo_default_og_image || undefined
  const url = `${DEFAULT_SITE_URL}/#/article/${article.slug}`
  const indexArticles = (seo.seo_index_articles ?? 'true') === 'true'

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: indexArticles
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      siteName: seo.seo_og_site_name || siteName,
      images: ogImage ? [{ url: ogImage, alt: title }] : undefined,
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt?.toISOString(),
      authors: [siteName],
      section: article.category?.name || undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

/** Build per-video metadata (same idea as articles). */
export async function buildVideoMetadata(video: {
  title: string
  slug: string
  description?: string | null
  coverImage?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  ogImage?: string | null
  durationSec?: number | null
  createdAt?: Date | null
  category?: { name?: string | null } | null
}): Promise<Metadata> {
  const seo = await getSeoSettings()
  const brand = await getBrandSettings()
  const siteName = brand.site_name || 'راهکار جوان'
  const title = video.metaTitle || video.title
  const description = (video.metaDescription || video.description || '').slice(0, 160)
  const ogImage = video.ogImage || video.coverImage || seo.seo_default_og_image || undefined
  const url = `${DEFAULT_SITE_URL}/#/video/${video.slug}`
  const indexVideos = (seo.seo_index_videos ?? 'true') === 'true'
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: indexVideos ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: 'video.other' as any,
      title,
      description,
      url,
      siteName: seo.seo_og_site_name || siteName,
      images: ogImage ? [{ url: ogImage, alt: title }] : undefined,
    },
    twitter: {
      card: 'player',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

/** Build per-category metadata. */
export async function buildCategoryMetadata(category: {
  name: string
  slug: string
  description?: string | null
}): Promise<Metadata> {
  const seo = await getSeoSettings()
  const brand = await getBrandSettings()
  const siteName = brand.site_name || 'راهکار جوان'
  const url = `${DEFAULT_SITE_URL}/#/category/${category.slug}`
  const indexCats = (seo.seo_index_categories ?? 'true') === 'true'
  const title = `${category.name} | ${siteName}`
  const description = category.description || `آخرین اخبار دسته ${category.name} در ${siteName}`
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: indexCats ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: 'website',
      title,
      description,
      url,
      siteName: seo.seo_og_site_name || siteName,
    },
  }
}

/**
 * Build JSON-LD structured data blocks for the article page. Two blocks:
 *   1. Organization (global, for site identity / knowledge panel)
 *   2. NewsArticle (per-article)
 *
 * Returns an array ready to inject with <script type="application/ld+json">.
 */
export async function buildArticleJsonLd(article: {
  title: string
  slug: string
  excerpt?: string | null
  coverImage?: string | null
  publishedAt?: Date | null
  updatedAt?: Date
  sourceName?: string | null
  category?: { name?: string | null } | null
  author?: { displayName?: string | null; name?: string | null } | null
}): Promise<Record<string, any>[]> {
  const seo = await getSeoSettings()
  const brand = await getBrandSettings()
  const siteName = brand.site_name || 'راهکار جوان'
  const orgName = seo.seo_org_name || siteName
  const orgLogo = seo.seo_org_logo || brand.logo_url || `${DEFAULT_SITE_URL}/icon.svg`
  const sameAs = seo.seo_org_same_as
    ? seo.seo_org_same_as.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  const org: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: orgName,
    url: DEFAULT_SITE_URL,
    logo: orgLogo,
  }
  if (sameAs.length) org.sameAs = sameAs

  const articleLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: (article.excerpt || '').slice(0, 300) || undefined,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt?.toISOString(),
    author: {
      '@type': 'Person',
      name: article.author?.displayName || article.author?.name || article.sourceName || siteName,
    },
    publisher: {
      '@type': 'Organization',
      name: orgName,
      logo: { '@type': 'ImageObject', url: orgLogo },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${DEFAULT_SITE_URL}/#/article/${article.slug}` },
  }
  if (article.coverImage) {
    articleLd.image = article.coverImage
  }
  if (article.category?.name) {
    articleLd.articleSection = article.category.name
  }
  return [org, articleLd]
}

/** Build JSON-LD for the homepage (Organization + WebSite with SearchAction). */
export async function buildHomeJsonLd(): Promise<Record<string, any>[]> {
  const seo = await getSeoSettings()
  const brand = await getBrandSettings()
  const siteName = brand.site_name || 'راهکار جوان'
  const orgName = seo.seo_org_name || siteName
  const orgLogo = seo.seo_org_logo || brand.logo_url || `${DEFAULT_SITE_URL}/icon.svg`
  const sameAs = seo.seo_org_same_as
    ? seo.seo_org_same_as.split(',').map((s) => s.trim()).filter(Boolean)
    : []
  const org: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: orgName,
    url: DEFAULT_SITE_URL,
    logo: orgLogo,
  }
  if (sameAs.length) org.sameAs = sameAs
  const site: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: DEFAULT_SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${DEFAULT_SITE_URL}/#/search?q={query}`,
      'query-input': 'required name=query',
    },
  }
  return [org, site]
}
