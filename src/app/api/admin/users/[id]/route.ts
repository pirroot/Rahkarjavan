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
    const updateData: any = {}
    if (body.role !== undefined) updateData.role = body.role
    if (body.name !== undefined) updateData.name = body.name
    if (body.displayName !== undefined) updateData.displayName = body.displayName
    if (body.bio !== undefined) updateData.bio = body.bio
    const user = await db.user.update({ where: { id }, data: updateData, select: { id: true, email: true, name: true, displayName: true, role: true, avatar: true, bio: true } })
    return NextResponse.json({ user })
  } catch (e) {
    console.error('Update user error:', e)
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
  if (id === session.user.id) {
    return NextResponse.json({ error: 'نمی‌توانید حساب خودتان را حذف کنید' }, { status: 400 })
  }
  try {
    await db.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Delete user error:', e)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
