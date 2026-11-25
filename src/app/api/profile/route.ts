import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { uploadFile } from '@/lib/storage'
import * as fs from 'fs'
import * as path from 'path'

const AVATAR_MAX_BYTES = 500 * 1024 // 500 KB
const AVATAR_TARGET_BYTES = 450 * 1024 // 450 KB after compression leaves headroom
const AVATAR_DIMENSION = 256 // square avatar

/**
 * Whitelisted predefined avatar paths (under /avatars/). Users may pick one
 * from the gallery OR upload a custom image (≤ 500 KB, resized and compressed
 * to fit). This keeps the site visually consistent while still allowing
 * custom avatars the client asked for.
 */
function isAllowedAvatar(value: string | null | undefined): boolean {
  if (!value) return true // null/empty = clear avatar
  // Allow predefined gallery paths under /avatars/ that exist on disk.
  if (!value.startsWith('/avatars/')) return false
  try {
    const filePath = path.join(process.cwd(), 'public', value)
    return fs.existsSync(filePath)
  } catch {
    return false
  }
}

/** Is the value an uploaded-avatar URL (served from /api/storage/avatars/)? */
function isUploadedAvatar(value: string | null | undefined): boolean {
  if (!value) return false
  return value.startsWith('/api/storage/avatars/') ||
         value.startsWith('/storage/avatars/') ||
         value.startsWith('avatars/')
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'لطفاً وارد شوید' }, { status: 401 })
  }
  try {
    // The frontend may send either JSON (profile fields + predefined avatar)
    // or no body (no change). Avatar upload is a separate endpoint.
    const contentType = req.headers.get('content-type') || ''
    let body: any = {}
    if (contentType.includes('application/json')) {
      body = await req.json()
    }
    const updateData: any = {}
    if (body.displayName !== undefined) updateData.displayName = body.displayName
    if (body.name !== undefined) updateData.name = body.name
    if (body.bio !== undefined) updateData.bio = body.bio?.slice(0, 500) ?? null
    if (body.avatar !== undefined) {
      // Accept either a predefined gallery avatar or a previously uploaded
      // custom avatar (served from our storage). Reject arbitrary external URLs.
      if (!isAllowedAvatar(body.avatar) && !isUploadedAvatar(body.avatar)) {
        return NextResponse.json(
          { error: 'آواتار باید از گالری پیش‌فرض انتخاب شود یا از آپلود شخصی باشد.' },
          { status: 400 }
        )
      }
      updateData.avatar = body.avatar || null
    }
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

/**
 * POST /api/profile — upload a custom avatar image.
 *
 * Accepts multipart/form-data with a single `file` field. The image must be
 * ≤ 500 KB and a real image (jpeg/png/webp). We resize it to 256x256 and
 * re-encode as JPEG with progressive quality until it fits under ~450 KB,
 * then store it under /avatars/ and return the public URL. The client asked
 * for a hard 500 KB cap to keep the small VPS disk light.
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'لطفاً وارد شوید' }, { status: 401 })
  }
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'فایل ارسال نشده' }, { status: 400 })
    }
    if (file.size > AVATAR_MAX_BYTES) {
      return NextResponse.json(
        { error: `حجم تصویر باید کمتر از ۵۰۰ کیلوبایت باشد. حجم فعلی: ${(file.size / 1024).toFixed(0)} کیلوبایت.` },
        { status: 413 }
      )
    }
    // Validate MIME type
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: 'فقط فرمت‌های JPG، PNG و WebP مجاز هستند.' },
        { status: 415 }
      )
    }

    const buf = Buffer.from(await file.arrayBuffer())

    // Resize + compress with sharp until under target size.
    let processed: Buffer
    let quality = 85
    try {
      const sharp = require('sharp')
      processed = await sharp(buf)
        .resize(AVATAR_DIMENSION, AVATAR_DIMENSION, { fit: 'cover', position: 'attention' })
        .jpeg({ quality, progressive: true, mozjpeg: true })
        .toBuffer()
      // Shrink further if still above target
      while (processed.length > AVATAR_TARGET_BYTES && quality > 35) {
        quality -= 10
        processed = await sharp(processed)
          .jpeg({ quality, progressive: true, mozjpeg: true })
          .toBuffer()
      }
    } catch (e: any) {
      // sharp not available — keep the original buffer (already size-checked)
      processed = buf
    }

    if (processed.length > AVATAR_MAX_BYTES) {
      return NextResponse.json(
        { error: 'تصویر پس از فشرده‌سازی همچنان بزرگ‌تر از ۵۰۰ کیلوبایت است. لطفاً تصویر کوچک‌تری بفرستید.' },
        { status: 413 }
      )
    }

    // Store under /avatars/ so it's served alongside the predefined ones.
    const ext = '.jpg'
    const filename = `avatar-${session.user.id}${ext}`
    const result = await uploadFile(processed, filename, 'avatars', 'image/jpeg')

    // Persist the new avatar URL on the user
    await db.user.update({
      where: { id: session.user.id },
      data: { avatar: result.url },
    })

    return NextResponse.json({ url: result.url, size: processed.length })
  } catch (e: any) {
    console.error('Avatar upload error:', e)
    const msg = e?.message || 'خطا در آپلود'
    const friendly = /EACCES|permission/i.test(msg)
      ? `خطای دسترسی به ذخیره‌سازی: ${msg}. بررسی کنید STORAGE_LOCAL_DIR روی مسیری قابل نوشتن تنظیم شده باشد.`
      : msg
    return NextResponse.json({ error: friendly }, { status: 500 })
  }
}

/**
 * GET /api/profile — return either the predefined avatar gallery list or the
 * current user's profile (with bio).
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  if (url.searchParams.get('avatars') === '1') {
    try {
      const manifestPath = path.join(process.cwd(), 'public/avatars/manifest.json')
      const raw = await fs.promises.readFile(manifestPath, 'utf-8')
      const list = JSON.parse(raw) as string[]
      return NextResponse.json({ avatars: list })
    } catch {
      return NextResponse.json({ avatars: [] })
    }
  }
  // Default GET: return the current user (same as /api/auth/me but with bio)
  const session = await getSession()
  if (!session) return NextResponse.json({ user: null })
  return NextResponse.json({ user: session.user })
}
