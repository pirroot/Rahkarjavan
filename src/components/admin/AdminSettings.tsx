'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Save, Upload, X, Loader2, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

export function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [faviconUploading, setFaviconUploading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => setSettings(d.settings || {}))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const r = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!r.ok) throw new Error('خطا')
      toast.success('تنظیمات ذخیره شد')
    } catch (e: any) {
      toast.error(e.message || 'خطا')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Skeleton className="h-96 w-full" />
  }

  const update = (key: string, value: string) => {
    setSettings({ ...settings, [key]: value })
  }

  // Upload handler for logo / favicon
  const handleUpload = async (file: File, key: string, setUploading: (b: boolean) => void) => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', key === 'logo_url' ? 'logo' : 'favicon')
      const r = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      const json = await r.json()
      if (!r.ok) throw new Error(json.error || 'خطا در آپلود')
      update(key, json.file.url)
      toast.success('فایل آپلود شد')
    } catch (e: any) {
      toast.error(e.message || 'خطا در آپلود')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">تنظیمات سایت</h1>
          <p className="text-sm text-muted-foreground">اطلاعات اصلی، لوگو، فاوآیکون و تماس سایت</p>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? 'در حال ذخیره...' : (
            <>
              <Save className="h-4 w-4 ml-1" />
              ذخیره تنظیمات
            </>
          )}
        </Button>
      </div>

      {/* Brand: Logo + Favicon */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">هویت بصری سایت</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <LogoUploader
            label="لوگوی سایت"
            hint="تصویر PNG یا SVG با پس‌زمینه‌ی شفاف، ابعاد حداقل ۱۲۸×۱۲۸ پیکسل. در نوار بالای سایت نمایش داده می‌شود."
            value={settings.logo_url || ''}
            uploading={logoUploading}
            onUpload={(file) => handleUpload(file, 'logo_url', setLogoUploading)}
            onClear={() => update('logo_url', '')}
            previewClassName="object-contain p-2"
            aspect="aspect-[3/1]"
          />
          <LogoUploader
            label="فاوآیکون (آیکون مرورگر)"
            hint="تصویر مربعی PNG/ICO/SVG با ابعاد حداقل ۳۲×۳۲ پیکسل. در تب مرورگر نمایش داده می‌شود."
            value={settings.favicon_url || ''}
            uploading={faviconUploading}
            onUpload={(file) => handleUpload(file, 'favicon_url', setFaviconUploading)}
            onClear={() => update('favicon_url', '')}
            previewClassName="object-contain p-1"
            aspect="aspect-square max-w-[120px]"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">اطلاعات عمومی</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>نام سایت (فارسی)</Label>
              <Input value={settings.site_name || ''} onChange={(e) => update('site_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>نام سایت (انگلیسی)</Label>
              <Input value={settings.site_name_en || ''} onChange={(e) => update('site_name_en', e.target.value)} dir="ltr" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>آدرس سایت</Label>
            <Input value={settings.site_url || ''} onChange={(e) => update('site_url', e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label>متن درباره ما</Label>
            <Textarea value={settings.about_text || ''} onChange={(e) => update('about_text', e.target.value)} rows={4} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">اطلاعات تماس</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>ایمیل</Label>
              <Input value={settings.contact_email || ''} onChange={(e) => update('contact_email', e.target.value)} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label>تلفن</Label>
              <Input value={settings.contact_phone || ''} onChange={(e) => update('contact_phone', e.target.value)} dir="ltr" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>نشانی</Label>
            <Textarea value={settings.address || ''} onChange={(e) => update('address', e.target.value)} rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">شبکه‌های اجتماعی</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>توییتر</Label>
            <Input value={settings.social_twitter || ''} onChange={(e) => update('social_twitter', e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label>اینستاگرام</Label>
            <Input value={settings.social_instagram || ''} onChange={(e) => update('social_instagram', e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label>تلگرام</Label>
            <Input value={settings.social_telegram || ''} onChange={(e) => update('social_telegram', e.target.value)} dir="ltr" />
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Terms editor (plain text) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">متن «حریم خصوصی و قوانین»</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground leading-6">
            متن ساده بنویسید، HTML لازم نیست. هر خط = یک پاراگراف. برای تیتر بزرگ، خط را با <code dir="ltr" className="bg-secondary px-1 rounded"># </code> شروع کنید. برای بولت، خط را با <code dir="ltr" className="bg-secondary px-1 rounded">- </code> شروع کنید.
          </p>
          <Textarea
            value={settings.legal_text || ''}
            onChange={(e) => update('legal_text', e.target.value)}
            rows={14}
            placeholder={'# حریم خصوصی و قوانین استفاده\n\nما به حریم خصوصی کاربران احترام می‌گذاریم...\n\n- نکته اول\n- نکته دوم'}
            className="font-mono text-sm leading-7"
          />
          <div className="text-xs text-muted-foreground">
            این متن در صفحه‌ی «حریم خصوصی و قوانین» پایین سایت نمایش داده می‌شود.
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

// Reusable uploader card (logo + favicon share the same UI, with live preview)
function LogoUploader({
  label,
  hint,
  value,
  uploading,
  onUpload,
  onClear,
  previewClassName,
  aspect,
}: {
  label: string
  hint: string
  value: string
  uploading: boolean
  onUpload: (file: File) => void
  onClear: () => void
  previewClassName: string
  aspect: string
}) {
  const inputId = `file-${label.replace(/\s/g, '-')}`

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground mt-1 leading-6">{hint}</p>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className={`relative ${aspect} w-full max-w-[280px] rounded-md overflow-hidden bg-secondary border border-border`}>
          {value ? (
            <>
              <img src={value} alt={label} className={`w-full h-full ${previewClassName}`} />
              <button
                type="button"
                onClick={onClear}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white hover:bg-destructive flex items-center justify-center"
                aria-label="حذف"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
              <ImageIcon className="h-8 w-8 mb-1" />
              <span className="text-xs">بدون تصویر</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            id={inputId}
            type="file"
            accept="image/png,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onUpload(f)
              e.target.value = ''
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => document.getElementById(inputId)?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 ml-1 animate-spin" />
                در حال آپلود...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 ml-1" />
                انتخاب فایل
              </>
            )}
          </Button>
          {value && <span className="text-xs text-muted-foreground">آپلود شد ✓</span>}
        </div>
      </div>
    </div>
  )
}
