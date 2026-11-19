// scheduler.ts — in-process scheduler (one-minute heartbeat)
// پایگاه خبری راهکار جوان
//
// For production we recommend calling /api/cron/crawl from an external cron
// (Linux crontab, Vercel Cron, cron-job.org). This in-process scheduler is a
// convenience for dev/standalone deployments.

import { runDueSources, reactivateExpiredSources } from './index'

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
