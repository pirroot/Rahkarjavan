// /api/admin/aggregator/logs — list crawl logs with optional filters
// پایگاه خبری راهکار جوان

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) return null
  return session
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غیرمجاز' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
  const sourceId = searchParams.get('sourceId') || undefined
  const status = searchParams.get('status') || undefined
  const from = searchParams.get('from')

  const logs = await db.crawlLog.findMany({
    where: {
      ...(sourceId ? { sourceId } : {}),
      ...(status ? { status } : {}),
      ...(from ? { startedAt: { gte: new Date(from) } } : {}),
    },
    include: { source: { select: { name: true } } },
    orderBy: { startedAt: 'desc' },
    take: limit,
  })

  // Parse errors string
  const out = logs.map((l) => ({
    ...l,
    errors: safeParseArray(l.errors),
  }))
  return NextResponse.json({ logs: out })
}

function safeParseArray(s: string | null | undefined): any[] {
  if (!s) return []
  try { const v = JSON.parse(s); return Array.isArray(v) ? v : [] } catch { return [] }
}
