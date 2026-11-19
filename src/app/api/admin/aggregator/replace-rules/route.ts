// /api/admin/aggregator/replace-rules — list, create, update, delete replace rules
// پایگاه خبری راهکار جوان

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { replaceRuleSchema, type ReplaceRuleInput } from '@/lib/aggregator/validation'
import { previewRules } from '@/lib/aggregator/replace'

async function requireAdmin() {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) return null
  return session
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غیرمجاز' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const sourceId = searchParams.get('sourceId')
  // If sourceId filter requested, return source-specific + global (null)
  const where = sourceId
    ? { OR: [{ sourceId }, { sourceId: null }] }
    : {}
  const rules = await db.replaceRule.findMany({
    where,
    orderBy: [{ sourceId: 'desc' }, { order: 'desc' }, { createdAt: 'asc' }],
  })
  return NextResponse.json({ rules })
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غیرمجاز' }, { status: 403 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'ورودی نامعتبر' }, { status: 400 }) }
  const parsed = replaceRuleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'اعتبارسنجی ناموفق', details: parsed.error.flatten() }, { status: 422 })
  }
  const data: ReplaceRuleInput = parsed.data
  const created = await db.replaceRule.create({
    data: {
      sourceId: data.sourceId || null,
      find: data.find,
      replaceWith: data.replaceWith,
      isRegex: data.isRegex,
      caseSensitive: data.caseSensitive,
      order: data.order,
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
  const parsed = replaceRuleSchema.safeParse(rest)
  if (!parsed.success) {
    return NextResponse.json({ error: 'اعتبارسنجی ناموفق', details: parsed.error.flatten() }, { status: 422 })
  }
  const data = parsed.data
  const updated = await db.replaceRule.update({
    where: { id },
    data: {
      sourceId: data.sourceId || null,
      find: data.find,
      replaceWith: data.replaceWith,
      isRegex: data.isRegex,
      caseSensitive: data.caseSensitive,
      order: data.order,
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
  await db.replaceRule.delete({ where: { id } }).catch(() => {})
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest) {
  // preview: apply rules to sample text. Body: { text, rules: [...] }
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غیرمجاز' }, { status: 403 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'ورودی نامعتبر' }, { status: 400 }) }
  const text: string = body.text || ''
  const rules: any[] = body.rules || []
  // Apply rules manually using the same algorithm
  const out = previewRules(text, rules.map((r: any) => ({
    find: r.find, replaceWith: r.replaceWith, isRegex: r.isRegex, caseSensitive: r.caseSensitive,
  })))
  return NextResponse.json({ input: text, output: out })
}
