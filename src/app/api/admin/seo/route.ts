// /api/admin/seo — central SEO settings management.
// پایگاه خبری راهکار جوان
//
// All settings are stored as SiteSetting rows with the `seo_` prefix, so the
// admin can edit them through the dashboard without touching code. The
// `metadata` export in app/layout.tsx and the dynamic `generateMetadata`
// functions read these rows at request time and merge them with per-page
// defaults. This avoids duplicate metadata and invalid canonical URLs.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// Canonical keys for the SEO settings panel. Each has a sensible default
// baked in so the site still has reasonable metadata before the admin opens
// the panel.
export const SEO_KEYS = [
  // Global
  'seo_site_title',
  'seo_site_description',
  'seo_site_keywords',
  'seo_canonical_url',
  'seo_robots',
  'seo_default_og_image',
  // Open Graph
  'seo_og_site_name',
  'seo_og_locale',
  'seo_og_type',
  // Twitter
  'seo_twitter_card',
  'seo_twitter_site',
  'seo_twitter_creator',
  // JSON-LD
  'seo_org_name',
  'seo_org_logo',
  'seo_org_same_as',
  // Indexing controls
  'seo_index_articles',
  'seo_index_videos',
  'seo_index_categories',
  'seo_index_homepage',
  // robots.txt extras
  'seo_robots_extra_disallow',
] as const

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }
  const rows = await db.siteSetting.findMany({ where: { key: { startsWith: 'seo_' } } })
  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value
  // Site URL + sitemap/robots status for the admin panel.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rahkarjavan.ir'
  const articleCount = await db.article.count({ where: { isPublished: true, status: 'PUBLISHED' } })
  const videoCount = await db.video.count({ where: { isPublished: true } })
  const categoryCount = await db.category.count()
  return NextResponse.json({
    settings: map,
    status: {
      siteUrl,
      sitemapUrl: `${siteUrl}/sitemap.xml`,
      robotsUrl: `${siteUrl}/robots.txt`,
      articleCount,
      videoCount,
      categoryCount,
    },
  })
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }
  try {
    const body = await req.json()
    // Save every SEO_* key that was sent. We deliberately accept arbitrary
    // keys (still prefixed with seo_) so future additions don't require a
    // code change here.
    for (const [key, value] of Object.entries(body)) {
      if (!key.startsWith('seo_')) continue
      const v = String(value ?? '')
      await db.siteSetting.upsert({
        where: { key },
        create: { key, value: v },
        update: { value: v },
      })
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('SEO settings save error:', e)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
