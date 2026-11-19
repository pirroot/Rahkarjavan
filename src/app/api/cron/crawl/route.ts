// /api/cron/crawl — secure cron endpoint
// پایگاه خبری راهکار جوان
//
// Use Linux crontab (every minute):
//   * * * * * curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" \
//        https://rahkarjavan.ir/api/cron/crawl > /dev/null
//
// Or Vercel Cron in vercel.json:
//   { "crons": [
//     { "path": "/api/cron/crawl", "schedule": "* * * * *" }
//   ] }
//
// (Vercel Cron automatically sends the CRON_SECRET env var as `Authorization: Bearer <secret>`.)

import { NextRequest, NextResponse } from 'next/server'
import { runDueSources, reactivateExpiredSources } from '@/lib/aggregator'
import { startScheduler } from '@/lib/aggregator/scheduler'

export const runtime = 'nodejs'
export const maxDuration = 300

function checkSecret(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) return false
  // 1) Authorization: Bearer <secret>
  const auth = req.headers.get('authorization') || ''
  if (auth.startsWith('Bearer ')) {
    if (auth.slice(7) === expected) return true
  }
  // 2) X-Cron-Secret header
  if (req.headers.get('x-cron-secret') === expected) return true
  // 3) ?secret= query (for Vercel Cron fallback / testing)
  const q = new URL(req.url).searchParams.get('secret')
  if (q === expected) return true
  return false
}

export async function GET(req: NextRequest) {
  return handle(req)
}
export async function POST(req: NextRequest) {
  return handle(req)
}

async function handle(req: NextRequest) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Best-effort: also start in-process scheduler
  try { startScheduler() } catch {}

  const startedAt = new Date()
  const t0 = Date.now()
  try {
    await reactivateExpiredSources()
    const results = await runDueSources()
    return NextResponse.json({
      success: true,
      startedAt: startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - t0,
      sources: results.length,
      results,
    })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'cron error' },
      { status: 500 },
    )
  }
}
