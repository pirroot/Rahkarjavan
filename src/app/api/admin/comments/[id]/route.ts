import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }
  const { id } = await params
  try {
    const body = await req.json()
    const updateData: any = {}
    if (body.isApproved !== undefined) updateData.isApproved = Boolean(body.isApproved)
    if (body.content !== undefined) updateData.content = body.content
    const comment = await db.comment.update({ where: { id }, data: updateData })
    return NextResponse.json({ comment })
  } catch (e) {
    console.error('Update comment error:', e)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }
  const { id } = await params
  try {
    await db.comment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Delete comment error:', e)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
