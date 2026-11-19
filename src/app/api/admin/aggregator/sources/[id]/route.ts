// /api/admin/aggregator/sources/[id] — get, update, delete
// پایگاه خبری راهکار جوان

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { newsSourceSchema } from '@/lib/aggregator/validation'

async function requireAdmin() {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) return null
  return session
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غیرمجاز' }, { status: 403 })
  const s = await db.newsSource.findUnique({ where: { id } })
  if (!s) return NextResponse.json({ error: 'یافت نشد' }, { status: 404 })
  return NextResponse.json({
    source: {
      ...s,
      removeSelectors: safeParseArray(s.removeSelectors),
      categoryMap: safeParseObject(s.categoryMap),
    },
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غیرمجاز' }, { status: 403 })
  const existing = await db.newsSource.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'یافت نشد' }, { status: 404 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'ورودی نامعتبر' }, { status: 400 }) }
  const parsed = newsSourceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'اعتبارسنجی ناموفق', details: parsed.error.flatten() }, { status: 422 })
  }
  const data = parsed.data
  const updated = await db.newsSource.update({
    where: { id },
    data: {
      name: data.name,
      isActive: data.isActive,
      rssUrl: emptyToNull(data.rssUrl),
      listingUrl: emptyToNull(data.listingUrl),
      linkSelector: emptyToNull(data.linkSelector),
      useSitemap: data.useSitemap,
      titleSelector: emptyToNull(data.titleSelector),
      bodySelector: emptyToNull(data.bodySelector),
      imageSelector: emptyToNull(data.imageSelector),
      dateSelector: emptyToNull(data.dateSelector),
      categorySelector: emptyToNull(data.categorySelector),
      removeSelectors: JSON.stringify(data.removeSelectors || []),
      defaultCategoryId: emptyToNull(data.defaultCategoryId),
      categoryMap: JSON.stringify(data.categoryMap || {}),
      videoCategoryId: emptyToNull(data.videoCategoryId),
      autoPublishVideo: data.autoPublishVideo,
      autoPublish: data.autoPublish,
      useOriginalDate: data.useOriginalDate,
      addSourceCredit: data.addSourceCredit,
      maxItemsPerRun: data.maxItemsPerRun,
      intervalMinutes: data.intervalMinutes,
      respectRobots: data.respectRobots,
    },
  })
  return NextResponse.json({ source: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غیرمجاز' }, { status: 403 })
  // Detach articles (set sourceId/sourceName to null so they remain on the site).
  await db.article.updateMany({ where: { sourceId: id }, data: { sourceId: null } })
  await db.newsSource.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

function emptyToNull(s?: string | null): string | null {
  if (s == null) return null
  const t = s.trim()
  return t === '' ? null : t
}
function safeParseArray(s: string | null | undefined): string[] {
  if (!s) return []
  try { const v = JSON.parse(s); return Array.isArray(v) ? v : [] } catch { return [] }
}
function safeParseObject(s: string | null | undefined): Record<string, string> {
  if (!s) return {}
  try { return JSON.parse(s) } catch { return {} }
}
