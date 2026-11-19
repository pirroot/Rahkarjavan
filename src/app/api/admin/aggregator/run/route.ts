// /api/admin/aggregator/run — manually trigger one source or all sources
// پایگاه خبری راهکار جوان

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { runSource, runDueSources, reactivateExpiredSources } from '@/lib/aggregator'
import { getAggregatorSettings } from '@/lib/aggregator/types'

async function requireAdmin() {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) return null
  return session
}

// POST body: { sourceId?: string }   — if omitted, runs all due sources
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غیرمجاز' }, { status: 403 })
  let body: any = {}
  try { body = await req.json() } catch {}
  const startedAt = Date.now()

  if (body.sourceId) {
    const s = await db.newsSource.findUnique({ where: { id: body.sourceId } })
    if (!s) return NextResponse.json({ error: 'منبع یافت نشد' }, { status: 404 })
    const settings = await getAggregatorSettings()
    const result = await runSource(s, settings)
    return NextResponse.json({ results: [result], durationMs: Date.now() - startedAt })
  }

  // run all due
  await reactivateExpiredSources()
  const results = await runDueSources()
  return NextResponse.json({ results, durationMs: Date.now() - startedAt })
}
