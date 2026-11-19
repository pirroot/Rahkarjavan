import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const video = await db.video.findUnique({
    where: { slug },
    include: { category: true },
  })
  if (!video || !video.isPublished) {
    return NextResponse.json({ error: 'ویدیو یافت نشد' }, { status: 404 })
  }
  // Increment views
  await db.video.update({
    where: { id: video.id },
    data: { views: { increment: 1 } },
  })
  // Related videos (same category, excluding current)
  const related = video.categoryId
    ? await db.video.findMany({
        where: {
          isPublished: true,
          categoryId: video.categoryId,
          NOT: { id: video.id },
        },
        take: 4,
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      })
    : []
  return NextResponse.json({ video: { ...video, views: video.views + 1 }, related })
}
