import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }
  const { id } = await params
  try {
    const body = await req.json()
    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.titleEn !== undefined) updateData.titleEn = body.titleEn
    if (body.description !== undefined) updateData.description = body.description
    if (body.descriptionEn !== undefined) updateData.descriptionEn = body.descriptionEn
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage
    if (body.videoUrl !== undefined) updateData.videoUrl = body.videoUrl
    if (body.duration !== undefined) updateData.duration = body.duration
    if (body.isFeatured !== undefined) updateData.isFeatured = Boolean(body.isFeatured)
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished
    if (body.videoType !== undefined) updateData.videoType = body.videoType
    if (body.sourceName !== undefined) updateData.sourceName = body.sourceName
    if (body.sourceUrl !== undefined) updateData.sourceUrl = body.sourceUrl
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId || null

    const video = await db.video.update({ where: { id }, data: updateData })
    return NextResponse.json({ video })
  } catch (e) {
    console.error('Update video error:', e)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }
  const { id } = await params
  try {
    await db.video.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Delete video error:', e)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
