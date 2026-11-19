// Auth helper - integrates NextAuth.js with our legacy cookie-based session
// Priority: NextAuth session > custom cookie session

import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { auth } from '../../auth'

const SESSION_COOKIE = 'rj_session'
const SESSION_DURATION = 7 * 24 * 60 * 60 // 7 days in seconds

// Simple JWT-like token: base64(userId:email:role:timestamp)
function createToken(userId: string, email: string, role: string): string {
  const payload = `${userId}|${email}|${role}|${Date.now()}`
  return Buffer.from(payload).toString('base64')
}

function parseToken(token: string): { userId: string; email: string; role: string; ts: number } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [userId, email, role, ts] = decoded.split('|')
    if (!userId || !email || !role || !ts) return null
    const tsNum = parseInt(ts, 10)
    if (Date.now() - tsNum > SESSION_DURATION * 1000) return null
    return { userId, email, role, ts: tsNum }
  } catch {
    return null
  }
}

export async function setSessionCookie(userId: string, email: string, role: string) {
  const token = createToken(userId, email, role)
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getSession() {
  // 1. Try NextAuth session first
  try {
    const naSession = await auth()
    if (naSession?.user?.id) {
      const user = await db.user.findUnique({
        where: { id: naSession.user.id },
        select: { id: true, email: true, name: true, displayName: true, role: true, avatar: true, bio: true, createdAt: true },
      })
      if (user) {
        return { user, role: user.role as 'ADMIN' | 'EDITOR' | 'USER' }
      }
    }
  } catch (e) {
    // NextAuth not configured or error - fall through to cookie
  }

  // 2. Fall back to custom cookie session
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  const parsed = parseToken(token)
  if (!parsed) return null
  const user = await db.user.findUnique({
    where: { id: parsed.userId },
    select: { id: true, email: true, name: true, displayName: true, role: true, avatar: true, bio: true, createdAt: true },
  })
  if (!user) return null
  if (user.email !== parsed.email) return null
  return { user, role: parsed.role as 'ADMIN' | 'EDITOR' | 'USER' }
}

export async function verifyPassword(plain: string, hashed: string) {
  return bcrypt.compare(plain, hashed)
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10)
}

// Get client IP for rate limiting
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real
  return 'unknown'
}
