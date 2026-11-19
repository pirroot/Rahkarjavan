import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ videos: [], articles: [] })
  }
  const [videos, articles] = await Promise.all([
    db.video.findMany({
      where: {
        isPublished: true,
        OR: [{ title: { contains: q } }, { description: { contains: q } }],
      },
      take: 12,
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    }),
    db.article.findMany({
      where: {
        isPublished: true,
        status: 'PUBLISHED',
        OR: [{ title: { contains: q } }, { excerpt: { contains: q } }],
      },
      take: 12,
      orderBy: { publishedAt: 'desc' },
      include: { category: true, author: true },
    }),
  ])
  return NextResponse.json({ videos, articles })
}
