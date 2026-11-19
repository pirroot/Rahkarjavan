import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }
  const { id } = await params
  try {
    const body = await req.json()
    const cat = await db.category.update({
      where: { id },
      data: {
        name: body.name,
        nameEn: body.nameEn || null,
        description: body.description || null,
        type: body.type,
        color: body.color,
      },
    })
    return NextResponse.json({ category: cat })
  } catch (e) {
    console.error('Update category error:', e)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }
  const { id } = await params
  try {
    await db.category.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Delete category error:', e)
    return NextResponse.json({ error: 'دسته‌بندی در استفاده است و نمی‌توان آن را حذف کرد' }, { status: 400 })
  }
}
