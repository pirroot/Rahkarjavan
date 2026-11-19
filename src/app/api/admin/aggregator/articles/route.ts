// /api/admin/aggregator/articles — list, toggle published/draft, delete auto-imported articles
// پایگاه خبری راهکار جوان

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) return null
  return session
}

// GET /api/admin/aggregator/articles?sourceId=&status=&q=&limit=&offset=
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غیرمجاز' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const sourceId = searchParams.get('sourceId') || undefined
  const status = searchParams.get('status') || undefined
  const q = searchParams.get('q') || undefined
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  const where = {
    isAutoImported: true,
    ...(sourceId ? { sourceId } : {}),
    ...(status ? { status: status as any } : {}),
    ...(q ? { title: { contains: q } } : {}),
  }
  const [articles, total] = await Promise.all([
    db.article.findMany({
      where, orderBy: { createdAt: 'desc' },
      take: limit, skip: offset,
      include: { category: { select: { name: true } } },
    }),
    db.article.count({ where }),
  ])
  return NextResponse.json({ articles, total })
}

// PATCH /api/admin/aggregator/articles  body: { id, action: 'publish' | 'unpublish' | 'delete' }
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غیرمجاز' }, { status: 403 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'ورودی نامعتبر' }, { status: 400 }) }
  const id: string | undefined = body.id
  const action: string = body.action
  if (!id || !action) return NextResponse.json({ error: 'id و action الزامی‌اند' }, { status: 400 })

  if (action === 'publish') {
    const updated = await db.article.update({
      where: { id },
      data: { isPublished: true, status: 'PUBLISHED', publishedAt: new Date() },
    })
    return NextResponse.json({ article: updated })
  }
  if (action === 'unpublish') {
    const updated = await db.article.update({
      where: { id },
      data: { isPublished: false, status: 'DRAFT', publishedAt: null },
    })
    return NextResponse.json({ article: updated })
  }
  if (action === 'delete') {
    await db.article.delete({ where: { id } }).catch(() => {})
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ error: 'action نامعتبر' }, { status: 400 })
}
