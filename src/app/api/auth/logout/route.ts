// POST /api/auth/logout — fully sign the user out.
//
// Clears BOTH session stores we support:
//   1. The legacy custom cookie `rj_session` (set by setSessionCookie).
//   2. The NextAuth.js v5 session cookies (`authjs.session-token`,
//      `__Secure-authjs.session-token`, and the callback-url cookie).
//
// The previous version only cleared the custom cookie, so a user who had
// signed in via NextAuth (Google / GitHub / magic link) appeared "still
// logged in" after pressing the logout button — because `getSession()`
// falls through to the NextAuth session first. Clearing both fixes the
// "logout doesn't work" bug.

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { clearSessionCookie } from '@/lib/auth'

// All cookies NextAuth.js v5 may set. We delete every one we find; the ones
// that don't exist are simply ignored by the cookies() API.
const NEXTAUTH_COOKIES = [
  'authjs.session-token',
  '__Secure-authjs.session-token',
  'authjs.callback-url',
  '__Secure-authjs.callback-url',
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
  'next-auth.callback-url',
  '__Secure-next-auth.callback-url',
]

export async function POST() {
  // 1. Custom legacy cookie
  await clearSessionCookie()

  // 2. NextAuth cookies — delete each (path=/) so the browser removes them.
  const cookieStore = await cookies()
  for (const name of NEXTAUTH_COOKIES) {
    try {
      cookieStore.delete(name)
    } catch {
      // cookies().delete throws if the cookie doesn't exist in some Next
      // versions; setting it to empty with maxAge=0 also forces removal.
      cookieStore.set(name, '', { path: '/', maxAge: 0, httpOnly: true, sameSite: 'lax' })
    }
  }

  return NextResponse.json({ success: true })
}
