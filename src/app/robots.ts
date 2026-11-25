// robots.txt generator — reads admin SEO settings for extra disallow paths.
// پایگاه خبری راهکار جوان

import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rahkarjavan.ir'

export default async function robots(): Promise<MetadataRoute.Robots> {
  // Pull admin-configured extra disallow paths from the SEO settings.
  let extraDisallow: string[] = []
  try {
    const row = await db.siteSetting.findUnique({ where: { key: 'seo_robots_extra_disallow' } })
    if (row?.value) {
      extraDisallow = row.value
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
    }
  } catch { /* db not ready — ignore */ }

  const baseDisallow = ['/api/admin/', '/api/auth/', '/api/profile/', '/#/admin', '/#/profile', '/#/auth']

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...baseDisallow, ...extraDisallow],
      },
      // Block AI bots from admin area
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai'],
        allow: '/',
        disallow: ['/api/', '/#/admin', '/#/profile', '/#/auth'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
