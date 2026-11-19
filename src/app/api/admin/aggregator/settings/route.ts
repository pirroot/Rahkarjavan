// /api/admin/aggregator/settings — get and update global settings
// پایگاه خبری راهکار جوان

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getAggregatorSettings, setAggregatorSettings } from '@/lib/aggregator/types'
import { settingsSchema } from '@/lib/aggregator/validation'

async function requireAdmin() {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) return null
  return session
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غیرمجاز' }, { status: 403 })
  const settings = await getAggregatorSettings()
  return NextResponse.json({ settings })
}

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غیرمجاز' }, { status: 403 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'ورودی نامعتبر' }, { status: 400 }) }
  const parsed = settingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'اعتبارسنجی ناموفق', details: parsed.error.flatten() }, { status: 422 })
  }
  await setAggregatorSettings(parsed.data)
  const settings = await getAggregatorSettings()
  return NextResponse.json({ settings })
}
