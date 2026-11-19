import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const article = await db.article.findUnique({
    where: { slug },
    include: {
      category: true,
      author: true,
      comments: {
        where: { isApproved: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!article || !article.isPublished) {
    return NextResponse.json({ error: 'مطلب یافت نشد' }, { status: 404 })
  }
  await db.article.update({
    where: { id: article.id },
    data: { views: { increment: 1 } },
  })
  const related = article.categoryId
    ? await db.article.findMany({
        where: {
          isPublished: true,
          status: 'PUBLISHED',
          categoryId: article.categoryId,
          NOT: { id: article.id },
        },
        take: 3,
        orderBy: { publishedAt: 'desc' },
        include: { category: true, author: true },
      })
    : []
  return NextResponse.json({
    article: { ...article, views: article.views + 1 },
    related,
  })
}
