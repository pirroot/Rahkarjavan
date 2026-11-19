import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }
  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, name: true, displayName: true, role: true, avatar: true, bio: true, createdAt: true, _count: { select: { articles: true, comments: true } } },
  })
  return NextResponse.json({ users })
}
