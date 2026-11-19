import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const settings = await db.siteSetting.findMany()
  const map: Record<string, string> = {}
  for (const s of settings) map[s.key] = s.value
  return NextResponse.json({ settings: map })
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }
  try {
    const body = await req.json()
    for (const [key, value] of Object.entries(body)) {
      const existing = await db.siteSetting.findUnique({ where: { key } })
      if (existing) {
        await db.siteSetting.update({ where: { key }, data: { value: String(value) } })
      } else {
        await db.siteSetting.create({ data: { key, value: String(value) } })
      }
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Update settings error:', e)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
