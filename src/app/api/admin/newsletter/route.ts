// Admin: list / search / toggle / export / delete newsletter subscribers.
// پایگاه خبری راهکار جوان
//
// GET  ?q=&active=&export=csv   — list (with optional filters + CSV export)
// PATCH  { id, active }          — toggle subscription status (unsubscribe)
// DELETE { id }                  — hard delete a subscriber

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }
  const url = new URL(req.url)
  const q = url.searchParams.get('q') || ''
  const active = url.searchParams.get('active') // 'true' | 'false' | undefined
  const exportCsv = url.searchParams.get('export') === 'csv'

  const where: any = {}
  if (q) where.email = { contains: q }
  if (active === 'true') where.active = true
  if (active === 'false') where.active = false

  const subs = await db.newsletterSubscriber.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  if (exportCsv) {
    // RFC 4180-ish CSV with a UTF-8 BOM so Excel reads Persian correctly.
    const header = ['email', 'status', 'subscribed_at']
    const rows = subs.map((s) => [
      s.email,
      s.active ? 'active' : 'unsubscribed',
      s.createdAt.toISOString(),
    ])
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
    const csv =
      '\uFEFF' +
      [header, ...rows].map((r) => r.map(esc).join(',')).join('\r\n')
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="subscribers-${Date.now()}.csv"`,
      },
    })
  }

  // Summary stats for the dashboard
  const total = await db.newsletterSubscriber.count()
  const activeCount = await db.newsletterSubscriber.count({ where: { active: true } })
  return NextResponse.json({
    subscribers: subs,
    total: subs.length,
    summary: { total, active: activeCount, inactive: total - activeCount },
  })
}

// Toggle subscription status (unsubscribe / reactivate)
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }
  try {
    const { id, active } = await req.json()
    if (!id) return NextResponse.json({ error: 'id لازم است' }, { status: 400 })
    const updated = await db.newsletterSubscriber.update({
      where: { id },
      data: { active: !!active },
    })
    return NextResponse.json({ subscriber: updated })
  } catch (e: any) {
    return NextResponse.json({ error: 'خطا' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id لازم است' }, { status: 400 })
    await db.newsletterSubscriber.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'خطا' }, { status: 500 })
  }
}
