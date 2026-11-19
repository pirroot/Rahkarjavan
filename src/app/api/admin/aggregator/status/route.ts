// /api/admin/aggregator/status — scheduler status + global stats
// پایگاه خبری راهکار جوان

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getSchedulerStatus, startScheduler } from '@/lib/aggregator/scheduler'

async function requireAdmin() {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) return null
  return session
}

export async function GET() {
  // Always start the in-process scheduler on a status hit (idempotent)
  try { startScheduler() } catch {}

  if (!(await requireAdmin())) return NextResponse.json({ status: null, stats: null })

  const [totalSources, activeSources, disabledSources, todayLogs, totalArticles] = await Promise.all([
    db.newsSource.count(),
    db.newsSource.count({ where: { isActive: true } }),
    db.newsSource.count({ where: { isActive: false, autoDisabledAt: { not: null } } }),
    db.crawlLog.count({ where: { startedAt: { gte: startOfToday() } } }),
    db.article.count({ where: { isAutoImported: true } }),
  ])
  const published = await db.article.count({ where: { isAutoImported: true, isPublished: true } })
  const drafts = await db.article.count({ where: { isAutoImported: true, isPublished: false } })
  const failed = await db.crawlLog.count({ where: { status: 'FAILED', startedAt: { gte: startOfToday() } } })

  const status = getSchedulerStatus()
  return NextResponse.json({
    status,
    stats: {
      totalSources, activeSources, disabledSources,
      todayRuns: todayLogs,
      totalArticles, published, drafts,
      failedToday: failed,
    },
  })
}

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}
