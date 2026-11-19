// /api/admin/aggregator/junk-rules — list, create, update, delete junk (regex) rules
// پایگاه خبری راهکار جوان

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { junkRuleSchema } from '@/lib/aggregator/validation'

async function requireAdmin() {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) return null
  return session
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غیرمجاز' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const sourceId = searchParams.get('sourceId')
  const where = sourceId
    ? { OR: [{ sourceId }, { sourceId: null }] }
    : {}
  const rules = await db.junkRule.findMany({
    where,
    orderBy: [{ sourceId: 'desc' }, { createdAt: 'asc' }],
  })
  return NextResponse.json({ rules })
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غیرمجاز' }, { status: 403 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'ورودی نامعتبر' }, { status: 400 }) }
  const parsed = junkRuleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'اعتبارسنجی ناموفق', details: parsed.error.flatten() }, { status: 422 })
  }
  const data = parsed.data
  const created = await db.junkRule.create({
    data: {
      sourceId: data.sourceId || null,
      pattern: data.pattern,
      isActive: data.isActive,
    },
  })
  return NextResponse.json({ rule: created }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غیرمجاز' }, { status: 403 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'ورودی نامعتبر' }, { status: 400 }) }
  const { id, ...rest } = body
  if (!id) return NextResponse.json({ error: 'id الزامی است' }, { status: 400 })
  const parsed = junkRuleSchema.safeParse(rest)
  if (!parsed.success) {
    return NextResponse.json({ error: 'اعتبارسنجی ناموفق', details: parsed.error.flatten() }, { status: 422 })
  }
  const data = parsed.data
  const updated = await db.junkRule.update({
    where: { id },
    data: {
      sourceId: data.sourceId || null,
      pattern: data.pattern,
      isActive: data.isActive,
    },
  })
  return NextResponse.json({ rule: updated })
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غیرمجاز' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id الزامی است' }, { status: 400 })
  await db.junkRule.delete({ where: { id } }).catch(() => {})
  return NextResponse.json({ success: true })
}
