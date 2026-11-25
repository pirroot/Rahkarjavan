'use client'

// AdminPages — manage the About Us and Contact Us page content from the
// dashboard. Content is stored as SiteSetting rows so the admin doesn't
// have to touch code or the DB.
//
// Keys:
//   about_text        — main intro paragraph (already used by AboutPage)
//   about_mission     — "مأموریت ما" card text
//   about_vision      — "چشم‌انداز" card text
//   about_values      — "ارزش‌ها" card text
//   about_audience    — "جامعه هدف" card text
//   about_story       — "داستان ما" section (rich text, multiline)
//   contact_email     — public contact email
//   contact_phone     — public contact phone
//   contact_address   — public postal address
//   contact_hours     — working hours
//   contact_text      — short intro shown above the form

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Save, FileText, Phone, BookOpen } from 'lucide-react'
import { toast } from 'sonner'

const PAGE_KEYS = [
  'about_text',
  'about_mission',
  'about_vision',
  'about_values',
  'about_audience',
  'about_story',
  'contact_text',
  'contact_email',
  'contact_phone',
  'contact_address',
  'contact_hours',
] as const

export function AdminPages() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => setSettings(d.settings || {}))
      .finally(() => setLoading(false))
  }, [])

  const update = (key: string, value: string) =>
    setSettings((s) => ({ ...s, [key]: value }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    // Save only the keys we manage here (avoid overwriting unrelated keys
    // that other admin sections may be editing concurrently).
    const patch: Record<string, string> = {}
    for (const k of PAGE_KEYS) patch[k] = settings[k] || ''
    try {
      const r = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!r.ok) throw new Error('خطا')
      toast.success('محتوای صفحات ذخیره شد')
    } catch {
      toast.error('خطا در ذخیره‌سازی')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Skeleton className="h-96 w-full" />

  return (
    <form onSubmit={handleSave} className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            صفحات درباره ما و تماس با ما
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            مدیریت محتوای صفحات ثابت سایت
          </p>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? 'در حال ذخیره...' : (
            <>
              <Save className="h-4 w-4 ml-1" />
              ذخیره
            </>
          )}
        </Button>
      </div>

      {/* About page */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            صفحه درباره ما
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="متن معرفی (بخش اصلی)">
            <Textarea value={settings.about_text || ''} onChange={(e) => update('about_text', e.target.value)} rows={3} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="مأموریت ما">
              <Textarea value={settings.about_mission || ''} onChange={(e) => update('about_mission', e.target.value)} rows={2} />
            </Field>
            <Field label="چشم‌انداز">
              <Textarea value={settings.about_vision || ''} onChange={(e) => update('about_vision', e.target.value)} rows={2} />
            </Field>
            <Field label="ارزش‌ها">
              <Textarea value={settings.about_values || ''} onChange={(e) => update('about_values', e.target.value)} rows={2} />
            </Field>
            <Field label="جامعه هدف">
              <Textarea value={settings.about_audience || ''} onChange={(e) => update('about_audience', e.target.value)} rows={2} />
            </Field>
          </div>
          <Field label="داستان ما" hint="متن کامل بخش «داستان ما». می‌توانید چند پاراگراف بنویسید؛ هر خط یک پاراگراف محسوب می‌شود.">
            <Textarea value={settings.about_story || ''} onChange={(e) => update('about_story', e.target.value)} rows={8} />
          </Field>
        </CardContent>
      </Card>

      {/* Contact page */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            صفحه تماس با ما
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="متن معرفی فرم تماس">
            <Textarea value={settings.contact_text || ''} onChange={(e) => update('contact_text', e.target.value)} rows={2} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="ایمیل تماس">
              <Input value={settings.contact_email || ''} onChange={(e) => update('contact_email', e.target.value)} dir="ltr" />
            </Field>
            <Field label="تلفن تماس">
              <Input value={settings.contact_phone || ''} onChange={(e) => update('contact_phone', e.target.value)} dir="ltr" />
            </Field>
          </div>
          <Field label="نشانی پستی">
            <Textarea value={settings.contact_address || ''} onChange={(e) => update('contact_address', e.target.value)} rows={2} />
          </Field>
          <Field label="ساعات کاری">
            <Input value={settings.contact_hours || ''} onChange={(e) => update('contact_hours', e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? 'در حال ذخیره...' : (
            <>
              <Save className="h-4 w-4 ml-1" />
              ذخیره محتوا
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground leading-5">{hint}</p>}
    </div>
  )
}
