// Public newsletter subscribe endpoint
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'ایمیل معتبر وارد کنید' }, { status: 400 })
    }
    // Upsert: if exists, reactivate
    const existing = await db.newsletterSubscriber.findUnique({ where: { email } })
    if (existing) {
      if (!existing.active) {
        await db.newsletterSubscriber.update({ where: { id: existing.id }, data: { active: true } })
      }
      return NextResponse.json({ success: true, message: 'عضویت شما فعال است' })
    }
    await db.newsletterSubscriber.create({ data: { email } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Newsletter subscribe error:', e)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

// Unsubscribe (via query param ?email=)
export async function DELETE(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'ایمیل لازم است' }, { status: 400 })
    await db.newsletterSubscriber.updateMany({
      where: { email },
      data: { active: false },
    })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
