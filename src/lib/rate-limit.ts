// Rate limiting utility
// پایگاه خبری راهکار جوان
//
// Uses a sliding window approach with in-memory storage for speed.
// Falls back to Prisma-backed persistence for multi-instance deployments.
//
// Limits:
//   - Comments: 5 per 10 minutes per IP (anti-spam)
//   - Login attempts: 5 per 15 minutes per email (anti-brute-force)
//   - Contact messages: 3 per hour per IP
//   - Register: 3 per hour per IP
//   - General API: 100 per minute per IP

import { db } from '@/lib/db'

interface RateLimitConfig {
  // Maximum number of requests allowed in window
  max: number
  // Window duration in seconds
  windowSec: number
}

const LIMITS: Record<string, RateLimitConfig> = {
  comment: { max: 5, windowSec: 600 },       // 5 per 10 min
  login: { max: 5, windowSec: 900 },          // 5 per 15 min
  register: { max: 3, windowSec: 3600 },      // 3 per hour
  contact: { max: 3, windowSec: 3600 },       // 3 per hour
  api: { max: 100, windowSec: 60 },           // 100 per minute
  magicLink: { max: 3, windowSec: 3600 },     // 3 per hour per email
  aiRewrite: { max: 20, windowSec: 3600 },    // 20 AI rewrites per hour per user
}

// In-memory cache for fast lookups (per process)
// For multi-instance production, the Prisma DB is the source of truth
const memoryCache = new Map<string, { count: number; expiresAt: number }>()

// Periodic cleanup of expired memory cache entries
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt < now) {
      memoryCache.delete(key)
    }
  }
}, 60_000).unref()

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: number // ms timestamp
}

/**
 * Check rate limit for a given action + identifier.
 * Returns success=true if request is allowed, false if rate limited.
 */
export async function checkRateLimit(
  action: keyof typeof LIMITS,
  identifier: string,
): Promise<RateLimitResult> {
  const config = LIMITS[action]
  if (!config) {
    return { success: true, limit: 0, remaining: 0, resetAt: 0 }
  }

  const key = `${action}:${identifier}`
  const now = Date.now()
  const windowMs = config.windowSec * 1000

  // 1. Check in-memory cache first (fast path)
  const memoryEntry = memoryCache.get(key)
  if (memoryEntry && memoryEntry.expiresAt > now) {
    if (memoryEntry.count >= config.max) {
      return {
        success: false,
        limit: config.max,
        remaining: 0,
        resetAt: memoryEntry.expiresAt,
      }
    }
    memoryEntry.count++
    // Continue to also persist in DB (best effort)
  } else {
    memoryCache.set(key, { count: 1, expiresAt: now + windowMs })
  }

  // 2. Persist in database (for multi-instance consistency)
  // Best-effort: don't fail the request if DB write fails
  try {
    const existing = await db.rateLimit.findUnique({ where: { key } })
    if (existing) {
      if (existing.expiresAt < new Date(now)) {
        // Window expired, reset
        await db.rateLimit.update({
          where: { key },
          data: { count: 1, expiresAt: new Date(now + windowMs) },
        })
      } else if (existing.count >= config.max) {
        // Rate limited in DB
        memoryCache.set(key, { count: existing.count, expiresAt: existing.expiresAt.getTime() })
        return {
          success: false,
          limit: config.max,
          remaining: 0,
          resetAt: existing.expiresAt.getTime(),
        }
      } else {
        const updated = await db.rateLimit.update({
          where: { key },
          data: { count: { increment: 1 } },
        })
        memoryCache.set(key, { count: updated.count, expiresAt: existing.expiresAt.getTime() })
      }
    } else {
      await db.rateLimit.create({
        data: { key, count: 1, expiresAt: new Date(now + windowMs) },
      })
    }
  } catch (e) {
    // DB write failed (e.g. unique constraint race), continue with memory cache
  }

  const currentCount = memoryCache.get(key)?.count ?? 1
  return {
    success: true,
    limit: config.max,
    remaining: Math.max(0, config.max - currentCount),
    resetAt: now + windowMs,
  }
}

/**
 * Get client IP from request
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real
  return 'unknown'
}

/**
 * Format rate limit error message in Persian
 */
export function formatRateLimitError(resetAt: number): string {
  const remaining = Math.ceil((resetAt - Date.now()) / 1000)
  if (remaining < 60) {
    return `درخواست‌های بیش از حد. ${remaining} ثانیه دیگر دوباره تلاش کنید.`
  }
  const minutes = Math.ceil(remaining / 60)
  return `درخواست‌های بیش از حد. ${minutes} دقیقه دیگر دوباره تلاش کنید.`
}

/**
 * Set rate limit headers on response
 */
export function setRateLimitHeaders(
  res: Response,
  result: RateLimitResult,
): void {
  res.headers.set('X-RateLimit-Limit', String(result.limit))
  res.headers.set('X-RateLimit-Remaining', String(result.remaining))
  res.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)))
}
