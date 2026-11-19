import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }
  const comments = await db.comment.findMany({
    orderBy: { createdAt: 'desc' },
    include: { article: true, user: true },
    take: 50,
  })
  return NextResponse.json({ comments })
}
