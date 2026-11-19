import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getStorageStatus } from '@/lib/storage'

export async function GET() {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }

  // Database counts
  const [users, videos, articles, comments, categories, messages] = await Promise.all([
    db.user.count(),
    db.video.count(),
    db.article.count(),
    db.comment.count(),
    db.category.count(),
    db.contactMessage.count(),
  ])

  const storage = getStorageStatus()

  return NextResponse.json({
    database: {
      provider: process.env.DATABASE_URL?.startsWith('postgres') ? 'postgresql' : 'sqlite',
      connected: true,
      counts: { users, videos, articles, comments, categories, messages },
    },
    storage,
    auth: {
      nextAuth: true,
      credentials: true,
      google: !!process.env.AUTH_GOOGLE_ID,
      github: !!process.env.AUTH_GITHUB_ID,
      magicLink: !!process.env.AUTH_RESEND_KEY,
    },
  })
}
