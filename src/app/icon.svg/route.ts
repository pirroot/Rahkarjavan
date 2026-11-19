// Dynamic favicon route — serves the favicon configured in admin settings,
// or falls back to the static /logo.svg if no custom favicon is set.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const setting = await db.siteSetting.findUnique({ where: { key: 'favicon_url' } })
    const url = setting?.value
    if (url && /^https?:\/\//.test(url)) {
      // Remote URL: proxy the bytes so the browser sees image bytes, not JSON.
      const r = await fetch(url)
      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer())
        return new NextResponse(buf, {
          headers: {
            'Content-Type': r.headers.get('Content-Type') || 'image/x-icon',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      }
    }
    if (url && url.startsWith('/api/storage/')) {
      // Local stored favicon: proxy via internal fetch
      const r = await fetch(new URL(url, 'http://localhost:3000'))
      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer())
        return new NextResponse(buf, {
          headers: {
            'Content-Type': r.headers.get('Content-Type') || 'image/x-icon',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      }
    }
  } catch (e) {
    // fall through to redirect
  }
  // Fallback: redirect to static logo
  return NextResponse.redirect(new URL('/logo.svg', 'http://localhost:3000'))
}
