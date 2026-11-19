import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }
  const [userCount, articleCount, videoCount, totalViews] = await Promise.all([
    db.user.count(),
    db.article.count({ where: { isPublished: true } }),
    db.video.count({ where: { isPublished: true } }),
    db.article.aggregate({ _sum: { views: true } }),
  ])
  const videoViews = await db.video.aggregate({ _sum: { views: true } })

  const articlesByCategory = await db.article.groupBy({
    by: ['categoryId'],
    _sum: { views: true },
    _count: true,
  })

  const categories = await db.category.findMany()
  const catStats = articlesByCategory.map((g) => {
    const cat = categories.find((c) => c.id === g.categoryId)
    return {
      name: cat?.name ?? 'نامشخص',
      views: g._sum.views ?? 0,
      count: g._count,
    }
  })

  const recentArticles = await db.article.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { category: true, author: true },
  })

  const popularVideos = await db.video.findMany({
    take: 5,
    orderBy: { views: 'desc' },
    include: { category: true },
  })

  const recentComments = await db.comment.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { article: true },
  })

  const unreadMessages = await db.contactMessage.count({ where: { isRead: false } })

  return NextResponse.json({
    stats: {
      users: userCount,
      articles: articleCount,
      videos: videoCount,
      totalViews: (totalViews._sum.views ?? 0) + (videoViews._sum.views ?? 0),
      unreadMessages,
    },
    catStats,
    recentArticles,
    popularVideos,
    recentComments,
  })
}
