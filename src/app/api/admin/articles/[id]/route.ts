import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { calculateReadingTime, generateMetaDescription } from '@/lib/markdown'

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
    // Extended field list: now includes SEO + reading time fields.
    const fields = [
      'title', 'titleEn', 'excerpt', 'excerptEn', 'content', 'contentEn',
      'coverImage', 'isFeatured', 'isPublished', 'isBreaking', 'tags',
      'status', 'categoryId',
      'metaTitle', 'metaDescription', 'ogImage', 'readingTime',
    ]
    for (const f of fields) {
      if (body[f] !== undefined) {
        if (f === 'isFeatured' || f === 'isPublished' || f === 'isBreaking') {
          updateData[f] = Boolean(body[f])
        } else if (f === 'categoryId') {
          updateData[f] = body[f] || null
        } else if (f === 'readingTime') {
          updateData[f] = Number(body[f]) || undefined
        } else {
          updateData[f] = body[f]
        }
      }
    }
    // SCHEDULED: keep isPublished=false until the scheduled time arrives; a
    // periodic job (scheduler.ts) flips it to true when due. PUBLISHED: set
    // publishedAt = now if it was never set before.
    if (body.status === 'SCHEDULED' && body.publishedAt) {
      updateData.publishedAt = new Date(body.publishedAt)
      updateData.isPublished = false
    } else if (body.status === 'PUBLISHED' && body.isPublished !== false) {
      // Only set publishedAt if it wasn't already set (don't override original).
      const existing = await db.article.findUnique({ where: { id }, select: { publishedAt: true } })
      if (existing && !existing.publishedAt) updateData.publishedAt = new Date()
    } else if (body.status === 'DRAFT') {
      updateData.isPublished = false
    }
    // Auto-fill SEO/reading-time when the admin didn't supply them.
    if (body.content !== undefined && updateData.readingTime === undefined) {
      updateData.readingTime = calculateReadingTime(body.content)
    }
    if (body.metaDescription === undefined && body.content !== undefined) {
      updateData.metaDescription =
        body.excerpt || generateMetaDescription(body.content)
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
