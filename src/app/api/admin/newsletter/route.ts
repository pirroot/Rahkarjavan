// Admin: list / delete newsletter subscribers
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
  const subs = await db.newsletterSubscriber.findMany({
    where: q ? { email: { contains: q } } : {},
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ subscribers: subs, total: subs.length })
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
