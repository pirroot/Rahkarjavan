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
    const fields = ['title', 'titleEn', 'excerpt', 'excerptEn', 'content', 'contentEn', 'coverImage', 'isFeatured', 'isPublished', 'isBreaking', 'tags', 'status', 'categoryId']
    for (const f of fields) {
      if (body[f] !== undefined) {
        if (f === 'isFeatured' || f === 'isPublished' || f === 'isBreaking') {
          updateData[f] = Boolean(body[f])
        } else if (f === 'categoryId') {
          updateData[f] = body[f] || null
        } else {
          updateData[f] = body[f]
        }
      }
    }
    if (body.status === 'SCHEDULED' && body.publishedAt) {
      updateData.publishedAt = new Date(body.publishedAt)
    }
    const article = await db.article.update({ where: { id }, data: updateData })
    return NextResponse.json({ article })
  } catch (e) {
    console.error('Update article error:', e)
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
    await db.article.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Delete article error:', e)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
