// Upload endpoint — accepts multipart/form-data, stores via storage lib
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { uploadFile, deleteFile } from '@/lib/storage'

const MAX_SIZE = 200 * 1024 * 1024 // 200 MB (videos can be large)

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const folder = (formData.get('folder') as string) || 'uploads'

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'فایل ارسال نشده' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'حجم فایل بیش از حد مجاز (۵۰ مگابایت)' }, { status: 413 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadFile(buffer, file.name, folder, file.type || 'application/octet-stream')

    return NextResponse.json({
      file: {
        key: result.key,
        bucket: result.bucket,
        url: result.url,
        size: result.size,
        mimeType: result.mimeType,
      },
    })
  } catch (e: any) {
    console.error('Upload error:', e)
    // EACCES is a deployment-config issue the admin can fix; surface it
    // clearly instead of a generic "خطای سرور".
    const msg = e?.message || 'خطا در آپلود'
    const friendly = /EACCES|permission/i.test(msg)
      ? `خطای دسترسی به ذخیره‌سازی: ${msg}. بررسی کنید STORAGE_LOCAL_DIR روی مسیری قابل نوشتن تنظیم شده باشد.`
      : msg
    return NextResponse.json({ error: friendly }, { status: 500 })
  }
}

// Delete endpoint — body: { key: string }
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
  }
  try {
    const { key } = await req.json()
    if (!key) return NextResponse.json({ error: 'کلید فایل لازم است' }, { status: 400 })
    await deleteFile(key)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'خطا' }, { status: 500 })
  }
}
