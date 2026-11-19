import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { setSessionCookie, verifyPassword, getClientIp } from '@/lib/auth'
import { checkRateLimit, formatRateLimitError, setRateLimitHeaders } from '@/lib/rate-limit'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'اطلاعات وارد شده معتبر نیست' }, { status: 400 })
    }
    const { email, password } = parsed.data

    // Rate limit: 5 attempts per 15 min per email OR IP (whichever is stricter)
    const rateLimitEmail = await checkRateLimit('login', `email:${email.toLowerCase()}`)
    const rateLimitIp = await checkRateLimit('login', `ip:${ip}`)

    if (!rateLimitEmail.success) {
      const res = NextResponse.json(
        { error: formatRateLimitError(rateLimitEmail.resetAt) },
        { status: 429 }
      )
      setRateLimitHeaders(res, rateLimitEmail)
      return res
    }
    if (!rateLimitIp.success) {
      const res = NextResponse.json(
        { error: formatRateLimitError(rateLimitIp.resetAt) },
        { status: 429 }
      )
      setRateLimitHeaders(res, rateLimitIp)
      return res
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'کاربری با این ایمیل یافت نشد' }, { status: 404 })
    }
    const valid = await verifyPassword(password, user.password || '')
    if (!valid) {
      return NextResponse.json({ error: 'رمز عبور اشتباه است' }, { status: 401 })
    }
    await setSessionCookie(user.id, user.email, user.role)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        displayName: user.displayName,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    })
  } catch (e) {
    console.error('Login error:', e)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
