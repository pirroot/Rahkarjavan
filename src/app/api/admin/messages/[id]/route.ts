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
    const msg = await db.contactMessage.update({
      where: { id },
      data: { isRead: Boolean(body.isRead) },
    })
    return NextResponse.json({ message: msg })
  } catch (e) {
    console.error('Update message error:', e)
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
    await db.contactMessage.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Delete message error:', e)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
