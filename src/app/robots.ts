// robots.txt generator
// پایگاه خبری راهکار جوان

import { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rahkarjavan.ir'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/admin/', '/api/auth/', '/api/profile/', '/#/admin', '/#/profile'],
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
