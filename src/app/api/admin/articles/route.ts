import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { calculateReadingTime, generateMetaDescription, generateSlug } from '@/lib/markdown'

export async function GET() {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }
  const articles = await db.article.findMany({
    orderBy: { createdAt: 'desc' },
    include: { category: true, author: true },
  })
  return NextResponse.json({ articles })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }
  try {
    const body = await req.json()
    // Slug: explicit > generated from title. We use the Persian-aware slug
    // generator so titles with non-ASCII chars still get a sane URL.
    const slug = body.slug || generateSlug(body.title)
    const existing = await db.article.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'این slug قبلاً استفاده شده' }, { status: 409 })
    }
    // Reading time + auto meta description (when admin didn't fill them in).
    const readingTime = body.readingTime || calculateReadingTime(body.content || '')
    const metaDescription =
      body.metaDescription ||
      body.excerpt ||
      generateMetaDescription(body.content || '')
    const metaTitle = body.metaTitle || (body.title || '').slice(0, 60)
    // SCHEDULED: keep isPublished=false until the scheduled time arrives;
    // a periodic job (scheduler.ts) will flip it to true when due.
    const isScheduled = body.status === 'SCHEDULED'
    const isPublished = isScheduled ? false : body.isPublished !== false
    const publishedAt = isScheduled && body.publishedAt
      ? new Date(body.publishedAt)
      : isPublished
        ? new Date()
        : null
    const article = await db.article.create({
      data: {
        title: body.title,
        titleEn: body.titleEn || null,
        slug,
        excerpt: body.excerpt || '',
        excerptEn: body.excerptEn || null,
        content: body.content || '',
        contentEn: body.contentEn || null,
        coverImage: body.coverImage || '',
        views: 0,
        isFeatured: Boolean(body.isFeatured),
        isPublished,
        isBreaking: Boolean(body.isBreaking),
        authorId: session.user.id,
        categoryId: body.categoryId || null,
        tags: body.tags || '',
        status: body.status || 'PUBLISHED',
        publishedAt,
        // SEO fields
        metaTitle,
        metaDescription,
        ogImage: body.ogImage || body.coverImage || null,
        readingTime,
      },
    })
    return NextResponse.json({ article })
  } catch (e) {
    console.error('Create article error:', e)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
