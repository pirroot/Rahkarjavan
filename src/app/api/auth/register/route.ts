import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { setSessionCookie, hashPassword, getClientIp } from '@/lib/auth'
import { checkRateLimit, formatRateLimitError } from '@/lib/rate-limit'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2, 'نام باید حداقل ۲ کاراکتر باشد'),
  email: z.string().email('ایمیل معتبر نیست'),
  password: z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'),
})

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

  // Rate limit: 3 registrations per hour per IP
  const rateLimit = await checkRateLimit('register', `ip:${ip}`)
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: formatRateLimitError(rateLimit.resetAt) },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'اطلاعات نامعتبر' }, { status: 400 })
    }
    const { name, email, password } = parsed.data
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'این ایمیل قبلاً ثبت شده است' }, { status: 409 })
    }
    const hashed = await hashPassword(password)
    const user = await db.user.create({
      data: {
        email,
        name,
        displayName: name,
        password: hashed,
        role: 'USER',
      },
    })
    await setSessionCookie(user.id, user.email, user.role)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt,
      },
    })
  } catch (e) {
    console.error('Register error:', e)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
