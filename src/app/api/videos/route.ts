import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const type = searchParams.get('type')
  const featured = searchParams.get('featured')
  const sort = searchParams.get('sort') ?? 'latest'
  const limit = parseInt(searchParams.get('limit') ?? '50', 10)

  const where: any = { isPublished: true }
  if (category && category !== 'all') {
    const cat = await db.category.findUnique({ where: { slug: category } })
    if (cat) where.categoryId = cat.id
  }
  if (type && type !== 'all') {
    where.videoType = type.toUpperCase()
  }
  if (featured === 'true') {
    where.isFeatured = true
  }

  const orderBy =
    sort === 'popular'
      ? { views: 'desc' as const }
      : { createdAt: 'desc' as const }

  const videos = await db.video.findMany({
    where,
    orderBy,
    take: limit,
    include: { category: true },
  })

  return NextResponse.json({ videos })
}
