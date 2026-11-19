import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'لطفاً وارد شوید' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const updateData: any = {}
    if (body.displayName !== undefined) updateData.displayName = body.displayName
    if (body.name !== undefined) updateData.name = body.name
    if (body.bio !== undefined) updateData.bio = body.bio?.slice(0, 500) ?? null
    if (body.avatar !== undefined) updateData.avatar = body.avatar || null
    const user = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { id: true, email: true, name: true, displayName: true, role: true, avatar: true, bio: true, createdAt: true },
    })
    return NextResponse.json({ user })
  } catch (e) {
    console.error('Update profile error:', e)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
