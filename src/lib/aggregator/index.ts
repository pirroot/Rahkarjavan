// index.ts — orchestrator: run a single NewsSource through the whole pipeline
// پایگاه خبری راهکار جوان

import { db } from '@/lib/db'
import {
  AggregatorSettings, SourceRunResult, getAggregatorSettings,
  normalizeUrl, parseStringArray, parseStringObject, titleHash,
} from './types'
import { discoverArticles } from './discover'
import { extractArticle } from './extract'
import { cleanHtml, urlHost } from './clean'
import { loadReplaceRules, applyRulesToArticle } from './replace'
import { rehostImages, downloadAndStoreImage } from './images'
import { alreadyImported, publishArticle } from './publish'

const MAX_CONSECUTIVE_FAILURES = 5
const AUTO_DISABLE_HOURS = 3

/** Run all due sources. Called by scheduler or cron endpoint. */
export async function runDueSources(): Promise<SourceRunResult[]> {
  const settings = await getAggregatorSettings()
  const now = new Date()
  const results: SourceRunResult[] = []

  const dueSources = await db.newsSource.findMany({
    where: {
      isActive: true,
      OR: [
        { lastRunAt: null },
        { lastRunAt: { lte: new Date(now.getTime() - 1) } },
      ],
    },
  })

  for (const source of dueSources) {
    // Determine if it's actually due by its own interval
    const intervalMs = (source.intervalMinutes || settings.defaultIntervalMinutes) * 60 * 1000
    if (source.lastRunAt && (now.getTime() - source.lastRunAt.getTime()) < intervalMs) {
      continue
    }
    try {
      const r = await runSource(source, settings)
      results.push(r)
    } catch (e: any) {
      results.push({
        sourceId: source.id,
        sourceName: source.name,
        found: 0, created: 0, published: 0, skipped: 0, failed: 1,
        errors: [{ url: '', error: e?.message || 'fatal source error' }],
        status: 'FAILED',
        durationMs: 0,
      })
    }
  }
  return results
}

/** Run a single source through the full pipeline. Mutates CrawlLog + NewsSource. */
export async function runSource(
  source: { id: string; name: string; [k: string]: any },
  settings?: AggregatorSettings,
): Promise<SourceRunResult> {
  const cfg = settings ?? await getAggregatorSettings()
  const startedAt = new Date()
  const startTime = Date.now()

  // Reload with all fields (in case a partial object was passed in)
  const s = await db.newsSource.findUnique({ where: { id: source.id } })
  if (!s) {
    return fail(source.id, source.name, 'source not found', 0)
  }
  if (!s.isActive) {
    return fail(s.id, s.name, 'source inactive', 0)
  }

  // Mark running
  await db.newsSource.update({
    where: { id: s.id },
    data: { lastStatus: 'RUNNING', lastError: null },
  })

  // Acquire advisory lock to avoid concurrent runs of the same source
  const lockKey = `lock:source:${s.id}`
  const lock = await db.rateLimit.findUnique({ where: { key: lockKey } })
  if (lock && lock.expiresAt > new Date()) {
    return fail(s.id, s.name, 'already running', 0)
  }
  await db.rateLimit.upsert({
    where: { key: lockKey },
    create: { key: lockKey, count: 1, expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
    update: { count: 1, expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
  })

  // Begin CrawlLog
  const log = await db.crawlLog.create({
    data: { sourceId: s.id, startedAt, status: 'RUNNING', errors: '[]' },
  })

  const errors: { url: string; error: string }[] = []
  let found = 0, created = 0, published = 0, skipped = 0, failed = 0

  try {
    // 1) Discover
    const baseUrl = extractBaseFromSource(s)
    const items = await discoverArticles(
      {
        rssUrl: s.rssUrl,
        listingUrl: s.listingUrl,
        linkSelector: s.linkSelector,
        useSitemap: s.useSitemap,
        baseUrl,
      },
      cfg,
      s.maxItemsPerRun || cfg.defaultMaxItemsPerRun,
      s.respectRobots,
    )
    found = items.length

    // Latest-only mode: when enabled, skip items older than the source's last
    // successful run. Keeps the home ticker fresh without re-pulling archive.
    let lastRunAt: Date | null = null
    if (cfg.latestOnly && s.lastRunAt) {
      lastRunAt = new Date(s.lastRunAt)
    }

    // Load replace rules for this source
    const replaceRules = await loadReplaceRules(s.id)

    // Load junk rules (regex strings)
    const junkRows = await db.junkRule.findMany({
      where: { isActive: true, OR: [{ sourceId: s.id }, { sourceId: null }] },
    })
    const junkPatterns = junkRows.map((j) => j.pattern)

    // 2) Process each discovered item
    for (const item of items) {
      const normalizedUrl = normalizeUrl(item.url)
      // latest-only filter: skip items published before the source's last run
      if (lastRunAt && item.publishedAt && item.publishedAt < lastRunAt) {
        skipped++
        continue
      }
      // dedup check
      const existing = await db.article.findFirst({
        where: { sourceUrl: normalizedUrl },
        select: { id: true },
      })
      if (existing) { skipped++; continue }

      try {
        // extract
        const extracted = await extractArticle(
          item.url,
          {
            titleSelector: s.titleSelector,
            bodySelector: s.bodySelector,
            imageSelector: s.imageSelector,
            dateSelector: s.dateSelector,
            categorySelector: s.categorySelector,
            removeSelectors: parseStringArray(s.removeSelectors as unknown as string),
          },
          cfg,
          s.respectRobots,
        )
        if (!extracted) { skipped++; continue }
        if (!extracted.title || extracted.contentHtml.length < cfg.minContentLength) {
          skipped++
          continue
        }

        // dedup by title hash
        const hash = titleHash(extracted.title)
        if (await alreadyImported(normalizedUrl, hash)) { skipped++; continue }

        // clean
        const sourceHost = urlHost(extracted.url)
        const cleanedHtml = cleanHtml(extracted.contentHtml, { junkPatterns, sourceHost })

        // apply replace rules
        const { title, excerpt, contentHtml } = applyRulesToArticle(
          { title: extracted.title, excerpt: extracted.excerpt, contentHtml: cleanedHtml },
          replaceRules,
        )

        // re-host images (downloads each <img>)
        const { html: finalHtml, coverImage } = await rehostImages(
          contentHtml, extracted.url, cfg,
        )
        // Use coverImage from rehost (first image in body) or extracted.coverImage
        let chosenCover = coverImage
        if (!chosenCover && extracted.coverImage) {
          // download cover separately
          const r = await downloadAndStoreImage(extracted.coverImage, extracted.url, cfg)
          if (r.ok && r.url) chosenCover = r.url
        }

        // ---- Routing requirement: every imported item MUST have either a video
        // or a cover image. Items without any media are rejected (logged).
        const hasVideo = !!extracted.videoUrl

        // Global switch: when settings.importVideos is false, video pages are
        // NOT saved as videos. If such a page has no cover image either, we skip
        // it (we don't save a media-less article). If it does have a cover image,
        // we save it as a plain Article (the video URL is dropped at publish).
        if (hasVideo && !cfg.importVideos && !chosenCover) {
          skipped++
          errors.push({ url: item.url, error: 'video found but importVideos disabled and no cover image — skipped' })
          continue
        }

        if (!hasVideo && !chosenCover) {
          skipped++
          errors.push({ url: item.url, error: 'no media — skipped (no video and no image)' })
          continue
        }
        // For a video item that we will actually save as a Video, a video category
        // (or at least a default category) is required; without one we skip.
        if (hasVideo && cfg.importVideos && !s.videoCategoryId && !s.defaultCategoryId) {
          skipped++
          errors.push({ url: item.url, error: 'video found but no video/default category set — skipped' })
          continue
        }

        // publish
        const result = await publishArticle({
          source: {
            id: s.id,
            name: s.name,
            autoPublish: s.autoPublish,
            autoPublishVideo: s.autoPublishVideo,
            useOriginalDate: s.useOriginalDate,
            addSourceCredit: s.addSourceCredit,
            defaultCategoryId: s.defaultCategoryId,
            videoCategoryId: s.videoCategoryId,
            categoryMap: s.categoryMap,
          },
          article: { ...extracted, title, excerpt, contentHtml: finalHtml },
          coverImage: chosenCover,
        }, cfg)
        if (result.ok) {
          created++
          if (result.published) published++
        } else if (result.error?.startsWith('duplicate')) {
          skipped++
        } else {
          failed++
          errors.push({ url: item.url, error: result.error || 'publish error' })
        }
      } catch (e: any) {
        failed++
        errors.push({ url: item.url, error: e?.message || 'processing error' })
      }
    }

    // success: reset failure counter
    await db.newsSource.update({
      where: { id: s.id },
      data: {
        lastRunAt: new Date(),
        lastStatus: 'OK',
        lastError: null,
        consecutiveFailures: 0,
        autoDisabledAt: null,
      },
    })

    return finish(log, s, 'OK', startedAt, found, created, published, skipped, failed, errors, startTime)
  } catch (e: any) {
    failed++
    errors.push({ url: '', error: e?.message || 'source error' })
    // increment failure counter; auto-disable if exceeded
    const newFail = (s.consecutiveFailures || 0) + 1
    const disable = newFail >= (cfg.maxConsecutiveFailures || MAX_CONSECUTIVE_FAILURES)
    await db.newsSource.update({
      where: { id: s.id },
      data: {
        lastRunAt: new Date(),
        lastStatus: 'FAILED',
        lastError: e?.message || 'error',
        consecutiveFailures: newFail,
        isActive: !disable,
        autoDisabledAt: disable ? new Date() : null,
      },
    })
    return finish(log, s, 'FAILED', startedAt, found, created, published, skipped, failed, errors, startTime)
  } finally {
    // release lock
    await db.rateLimit.delete({ where: { key: lockKey } }).catch(() => {})
  }
}

function finish(
  log: { id: string },
  s: { id: string; name: string },
  status: 'OK' | 'FAILED' | 'SKIPPED',
  startedAt: Date,
  found: number,
  created: number,
  published: number,
  skipped: number,
  failed: number,
  errors: { url: string; error: string }[],
  startTime: number,
): SourceRunResult {
  const durationMs = Date.now() - startTime
  // cap errors to keep JSON small
  const trimmed = errors.slice(0, 50)
  db.crawlLog.update({
    where: { id: log.id },
    data: {
      finishedAt: new Date(),
      status,
      found, created, published, skipped, failed,
      errors: JSON.stringify(trimmed),
      durationMs,
    },
  }).catch(() => {})
  return {
    sourceId: s.id, sourceName: s.name,
    found, created, published, skipped, failed,
    errors: trimmed,
    status, durationMs,
  }
}

function fail(sourceId: string, sourceName: string, error: string, durationMs: number): SourceRunResult {
  return {
    sourceId, sourceName,
    found: 0, created: 0, published: 0, skipped: 0, failed: 1,
    errors: [{ url: '', error }],
    status: 'SKIPPED',
    durationMs,
  }
}

function extractBaseFromSource(s: any): string | undefined {
  const u = s.rssUrl || s.listingUrl
  if (!u) return undefined
  try {
    const url = new URL(u)
    return url.protocol + '//' + url.host
  } catch {
    return undefined
  }
}

// Re-enable sources whose auto-disable has expired
export async function reactivateExpiredSources(): Promise<number> {
  const cutoff = new Date(Date.now() - AUTO_DISABLE_HOURS * 60 * 60 * 1000)
  const r = await db.newsSource.updateMany({
    where: {
      isActive: false,
      autoDisabledAt: { not: null, lt: cutoff },
    },
    data: { isActive: true, autoDisabledAt: null, consecutiveFailures: 0 },
  })
  return r.count
}

// re-export commonly used pieces
export { runDueSources as runAll }
