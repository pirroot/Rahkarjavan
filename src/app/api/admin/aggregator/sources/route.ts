// /api/admin/aggregator/sources — list & create
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

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غیرمجاز' }, { status: 403 })
  const sources = await db.newsSource.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { articles: true, crawlLogs: true } },
    },
  })
  // normalize JSON-string fields to objects for the UI
  const out = sources.map((s) => ({
    ...s,
    removeSelectors: safeParseArray(s.removeSelectors),
    categoryMap: safeParseObject(s.categoryMap),
  }))
  return NextResponse.json({ sources: out })
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غیرمجاز' }, { status: 403 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'ورودی نامعتبر' }, { status: 400 }) }
  const parsed = newsSourceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'اعتبارسنجی ناموفق', details: parsed.error.flatten() }, { status: 422 })
  }
  const data = parsed.data
  const created = await db.newsSource.create({
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
  return NextResponse.json({ source: created }, { status: 201 })
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
