// scheduler.ts — in-process scheduler (one-minute heartbeat)
// پایگاه خبری راهکار جوان
//
// For production we recommend calling /api/cron/crawl from an external cron
// (Linux crontab, Vercel Cron, cron-job.org). This in-process scheduler is a
// convenience for dev/standalone deployments.

import { runDueSources, reactivateExpiredSources } from './index'
import { db } from '@/lib/db'

declare global {
  // eslint-disable-next-line no-var
  var __newsScheduler: {
    interval: NodeJS.Timeout | null
    lastRunAt: Date | null
    isRunning: boolean
    lastResults: any[] | null
    nextRunAt: Date | null
  } | undefined
}

const KEY = '__newsScheduler'
const HEARTBEAT_MS = 60 * 1000  // check every minute

export function startScheduler(): void {
  const state = getState()
  if (state.interval) return // already running
  state.interval = setInterval(heartbeat, HEARTBEAT_MS)
  // Don't keep the Node process alive solely for the scheduler.
  if (state.interval.unref) state.interval.unref()
}

function getState() {
  if (!global[KEY]) {
    global[KEY] = {
      interval: null,
      lastRunAt: null,
      isRunning: false,
      lastResults: null,
      nextRunAt: null,
    }
  }
  return global[KEY]!
}

async function heartbeat() {
  const state = getState()
  if (state.isRunning) return
  state.isRunning = true
  try {
    // 1. Publish any SCHEDULED articles whose time has come. We do this on
    // every heartbeat (every minute) so a scheduled article goes live within
    // 60 seconds of its target time, without needing a separate cron.
    await publishScheduledArticles()
    await reactivateExpiredSources()
    const results = await runDueSources()
    state.lastRunAt = new Date()
    state.lastResults = results.length ? results : null
    state.nextRunAt = new Date(Date.now() + HEARTBEAT_MS)
  } catch (e) {
    // swallow — the next tick will retry
    state.lastResults = [{ sourceId: '', sourceName: 'scheduler', status: 'FAILED', errors: [{ url: '', error: String(e) }], found: 0, created: 0, published: 0, skipped: 0, failed: 0, durationMs: 0 }]
  } finally {
    state.isRunning = false
  }
}

/**
 * Sweep: find every SCHEDULED article whose publishedAt is now or in the
 * past, flip its status to PUBLISHED + isPublished=true. Safe to call every
 * minute; rows that were already flipped are skipped by the `where` clause.
 */
async function publishScheduledArticles(): Promise<number> {
  try {
    const now = new Date()
    const r = await db.article.updateMany({
      where: {
        status: 'SCHEDULED',
        publishedAt: { lte: now },
      },
      data: {
        status: 'PUBLISHED',
        isPublished: true,
      },
    })
    return r.count
  } catch {
    return 0
  }
}

export function getSchedulerStatus() {
  const state = getState()
  return {
    running: !!state.interval,
    isRunning: state.isRunning,
    lastRunAt: state.lastRunAt,
    nextRunAt: state.nextRunAt,
    lastResultsCount: state.lastResults?.length || 0,
  }
}

/** Trigger one cycle manually (e.g. from the admin "Run now" button). */
export async function triggerCycle(): Promise<any[]> {
  await reactivateExpiredSources()
  const results = await runDueSources()
  const state = getState()
  state.lastRunAt = new Date()
  state.lastResults = results
  return results
}
