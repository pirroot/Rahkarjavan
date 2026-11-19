import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }
  const categories = await db.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { videos: true, articles: true } },
    },
  })
  return NextResponse.json({ categories })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }
  try {
    const body = await req.json()
    const slug = body.slug || body.name.replace(/\s+/g, '-').toLowerCase()
    const existing = await db.category.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'این slug قبلاً استفاده شده' }, { status: 409 })
    }
    const cat = await db.category.create({
      data: {
        name: body.name,
        nameEn: body.nameEn || null,
        slug,
        description: body.description || null,
        type: body.type || 'BOTH',
        color: body.color || '#dc2626',
      },
    })
    return NextResponse.json({ category: cat })
  } catch (e) {
    console.error('Create category error:', e)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
