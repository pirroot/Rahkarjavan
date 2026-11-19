import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }
  const videos = await db.video.findMany({
    orderBy: { createdAt: 'desc' },
    include: { category: true },
  })
  return NextResponse.json({ videos })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }
  try {
    const body = await req.json()
    const slug = body.slug || body.title.replace(/\s+/g, '-').toLowerCase()
    const existing = await db.video.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'این slug قبلاً استفاده شده' }, { status: 409 })
    }
    const video = await db.video.create({
      data: {
        title: body.title,
        titleEn: body.titleEn || null,
        slug,
        description: body.description || '',
        descriptionEn: body.descriptionEn || null,
        coverImage: body.coverImage || 'https://picsum.photos/seed/new/800/450',
        videoUrl: body.videoUrl || '',
        duration: body.duration || '00:00',
        views: parseInt(body.views || '0', 10),
        isFeatured: Boolean(body.isFeatured),
        isPublished: body.isPublished !== false,
        videoType: body.videoType || 'NEWS',
        sourceName: body.sourceName || null,
        sourceUrl: body.sourceUrl || null,
        categoryId: body.categoryId || null,
      },
    })
    return NextResponse.json({ video })
  } catch (e) {
    console.error('Create video error:', e)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
