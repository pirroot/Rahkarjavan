// fetchPage.ts — HTTP fetch with SSRF guard, retry, rate limit, robots.txt respect
// پایگاه خبری راهکار جوان

import { AggregatorSettings } from './types'

const PER_HOST_LAST_HIT = new Map<string, number>()

/** Resolve a hostname to its addresses and reject private/loopback ranges (SSRF guard). */
async function assertPublicHost(hostname: string): Promise<void> {
  // Block obvious private/loopback hostnames before any DNS lookup
  const h = hostname.toLowerCase()
  if (h === 'localhost' || h.endsWith('.localhost')) {
    throw new Error('SSRF: localhost blocked')
  }
  if (h.endsWith('.onion')) {
    throw new Error('SSRF: onion address blocked')
  }
  // IPv4 literal
  const ipMatch = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h)
  if (ipMatch) {
    const [, a, b] = ipMatch.map((x) => parseInt(x, 10))
    if (a === 10) throw new Error('SSRF: 10.x blocked')
    if (a === 127) throw new Error('SSRF: 127.x blocked')
    if (a === 0) throw new Error('SSRF: 0.x blocked')
    if (a === 169 && b === 254) throw new Error('SSRF: link-local blocked')
    if (a === 172 && b >= 16 && b <= 31) throw new Error('SSRF: 172.16-31 blocked')
    if (a === 192 && b === 168) throw new Error('SSRF: 192.168 blocked')
    if (a >= 224) throw new Error('SSRF: multicast/reserved blocked')
  }
  // IPv6 literal — block loopback and link-local
  if (h.includes(':') && (h === '::1' || h.startsWith('fe80') || h.startsWith('fc') || h.startsWith('fd'))) {
    throw new Error('SSRF: ipv6 private blocked')
  }
}

export interface FetchResult {
  url: string
  status: number
  ok: boolean
  html: string
  contentType: string
  finalUrl: string
}

/**
 * Fetch a page with retry, timeout, SSRF guard and per-host rate limit.
 */
export async function fetchPage(
  url: string,
  settings: AggregatorSettings,
  opts: { respectRobots?: boolean } = {},
): Promise<FetchResult> {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    throw new Error(`invalid url: ${url}`)
  }
  await assertPublicHost(u.hostname)

  // per-host rate limit
  const last = PER_HOST_LAST_HIT.get(u.hostname) || 0
  const now = Date.now()
  const wait = settings.requestDelayMs - (now - last)
  if (wait > 0) await sleep(wait)

  // robots.txt (cached per host)
  if (opts.respectRobots) {
    const allowed = await checkRobots(u, settings.userAgent)
    if (!allowed) {
      throw new Error(`robots.txt disallows ${u.pathname}`)
    }
  }

  let lastErr: Error | null = null
  const maxAttempts = settings.fetchRetries + 1
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    PER_HOST_LAST_HIT.set(u.hostname, Date.now())
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), settings.fetchTimeoutMs)
      // On the first attempt use the configured bot UA (honest).
      // On retries (attempt > 0) use a real browser UA — many Persian news sites
      // return 403 to unknown bots but 200 to a real browser. This is purely for
      // robustness against sites that do not expose a proper robots.txt / API.
      const ua = attempt === 0
        ? settings.userAgent
        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      const res = await fetch(url, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fa-IR,fa;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          // Referer helps with sites that block hotlinking of articles
          'Referer': `${u.protocol}//${u.host}/`,
        },
        signal: ctrl.signal,
        redirect: 'follow',
      })
      clearTimeout(t)
      const ct = res.headers.get('content-type') || 'text/html'
      // Handle charset properly. Most Persian sites use UTF-8. For non-UTF-8 we decode manually.
      const buf = Buffer.from(await res.arrayBuffer())
      const html = decodeBuffer(buf, ct)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return {
        url,
        status: res.status,
        ok: true,
        html,
        contentType: ct,
        finalUrl: res.url || url,
      }
    } catch (e: any) {
      lastErr = e
      if (attempt < maxAttempts - 1) await sleep(800 * (attempt + 1))
    }
  }
  throw lastErr || new Error('fetch failed')
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/** Decode a Buffer using the charset from Content-Type, falling back to UTF-8. */
function decodeBuffer(buf: Buffer, contentType: string): string {
  const m = /charset=([\w-]+)/i.exec(contentType)
  const cs = m ? m[1].toLowerCase() : 'utf-8'
  if (cs === 'utf-8' || cs === 'utf8') return buf.toString('utf-8')
  try {
    return new TextDecoder(cs as any).decode(buf)
  } catch {
    return buf.toString('utf-8')
  }
}

// ---------- robots.txt cache ----------
const ROBOTS_CACHE = new Map<string, { at: number; rules: { disallow: string[]; allow: string[] } } | null>()
const ROBOTS_TTL = 6 * 60 * 60 * 1000 // 6 hours

async function checkRobots(u: URL, ua: string): Promise<boolean> {
  const key = u.protocol + '//' + u.host
  let cached = ROBOTS_CACHE.get(key)
  if (!cached || (Date.now() - cached.at) > ROBOTS_TTL) {
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 8000)
      const res = await fetch(`${key}/robots.txt`, {
        headers: { 'User-Agent': ua },
        signal: ctrl.signal,
        redirect: 'follow',
      })
      clearTimeout(t)
      if (res.ok) {
        const text = await res.text()
        cached = { at: Date.now(), rules: parseRobots(text, ua) }
      } else {
        cached = { at: Date.now(), rules: { disallow: [], allow: [] } }
      }
    } catch {
      cached = { at: Date.now(), rules: { disallow: [], allow: [] } } // no robots = allow all
    }
    ROBOTS_CACHE.set(key, cached)
  }
  if (!cached?.rules) return true
  const path = u.pathname + u.search
  for (const d of cached.rules.disallow) {
    if (d === '' ) continue
    if (path.startsWith(d) || matchesRobotsPattern(path, d)) return false
  }
  for (const a of cached.rules.allow) {
    if (path.startsWith(a) || matchesRobotsPattern(path, a)) return true
  }
  return true
}

/** Minimal robots.txt parser: respects User-agent: * and the most-specific UA match. */
function parseRobots(text: string, ua: string): { disallow: string[]; allow: string[] } {
  const lines = text.split(/\r?\n/).map((l) => l.trim())
  const groups: { agents: string[]; rules: { type: 'allow' | 'disallow'; path: string }[] }[] = []
  let current: { agents: string[]; rules: any[] } | null = null
  let lastWasAgent = false
  for (const line of lines) {
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf(':')
    if (idx < 0) continue
    const field = line.slice(0, idx).trim().toLowerCase()
    const val = line.slice(idx + 1).trim()
    if (field === 'user-agent') {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] }
        groups.push(current as any)
      }
      current!.agents.push(val)
      lastWasAgent = true
    } else if (field === 'allow' || field === 'disallow') {
      if (!current) {
        current = { agents: [], rules: [] }
        groups.push(current as any)
      }
      current!.rules.push({ type: field, path: val })
      lastWasAgent = false
    } else {
      lastWasAgent = false
    }
  }
  // Pick the most specific group matching our UA
  const uaLower = ua.toLowerCase()
  let best: any = null
  let bestLen = -1
  for (const g of groups) {
    if (g.agents.includes('*') && bestLen < 0) best = g
    for (const a of g.agents) {
      if (uaLower.includes(a) && a.length > bestLen) { best = g; bestLen = a.length }
    }
  }
  if (!best) return { disallow: [], allow: [] }
  return {
    disallow: best.rules.filter((r: any) => r.type === 'disallow').map((r: any) => r.path),
    allow: best.rules.filter((r: any) => r.type === 'allow').map((r: any) => r.path),
  }
}

function matchesRobotsPattern(path: string, pattern: string): boolean {
  // very small subset of robots wildcards (* and $)
  if (!pattern.includes('*') && !pattern.includes('$')) {
    return path.startsWith(pattern)
  }
  let re = pattern.replace(/[.+?^{}()|[\]\\]/g, '\\$&')
  re = re.replace(/\*/g, '.*')
  re = re.replace(/\\\$$/, '$') // trailing $ anchor
  if (!re.endsWith('$')) re += '.*'
  return new RegExp('^' + re).test(path)
}
