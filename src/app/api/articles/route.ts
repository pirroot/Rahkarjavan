import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const featured = searchParams.get('featured')
  const sort = searchParams.get('sort') ?? 'latest'
  const limit = parseInt(searchParams.get('limit') ?? '50', 10)
  const after = searchParams.get('after') // cursor = last article id for "latest" paging

  const where: any = { isPublished: true, status: 'PUBLISHED' }
  if (category && category !== 'all') {
    const cat = await db.category.findUnique({ where: { slug: category } })
    if (cat) where.categoryId = cat.id
  }
  if (featured === 'true') {
    where.isFeatured = true
  }

  // Cursor-based pagination (only supported for "latest")
  let cursorObj: any = undefined
  if (after && sort === 'latest') {
    const last = await db.article.findUnique({ where: { id: after }, select: { publishedAt: true } })
    if (last) {
      cursorObj = { publishedAt: last.publishedAt }
      // Exclude the cursor row itself; also avoid ties by adding id filter via where
      where.NOT = { id: after }
      where.publishedAt = { lt: last.publishedAt }
    }
  }

  const orderBy =
    sort === 'popular'
      ? { views: 'desc' as const }
      : { publishedAt: 'desc' as const }

  const articles = await db.article.findMany({
    where,
    orderBy,
    take: limit,
    include: { category: true, author: true },
  })

  return NextResponse.json({ articles })
}
