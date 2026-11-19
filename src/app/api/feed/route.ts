// RSS Feed: /api/feed.xml
// Provides RSS feed of latest articles for aggregator sites

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const articles = await db.article.findMany({
    where: { isPublished: true, status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    take: 20,
    include: { category: true, author: true },
  })

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rahkarjavan.ir'
  const SITE_NAME = 'پایگاه خبری راهکار جوان'

  const items = articles.map((a) => `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${SITE_URL}/#/article/${a.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/#/article/${a.slug}</guid>
      <description><![CDATA[${a.excerpt}]]></description>
      ${a.category ? `<category>${a.category.name}</category>` : ''}
      ${a.author ? `<dc:creator><![CDATA[${a.author.displayName || a.author.name}]]></dc:creator>` : ''}
      <pubDate>${new Date(a.publishedAt || a.createdAt).toUTCString()}</pubDate>
    </item>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title><![CDATA[${SITE_NAME}]]></title>
    <link>${SITE_URL}</link>
    <description><![CDATA[رسانه تصویری و مجله خبری جوانان]]></description>
    <language>fa-IR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Rahkar Javan CMS</generator>
    ${items}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
