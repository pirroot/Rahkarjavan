'use client'

// AdminSeo — central SEO settings panel.
// پایگاه خبری راهکار جوان
//
// Lets the admin configure global meta, OpenGraph, Twitter cards, JSON-LD
// organization, indexing controls, and inspect the sitemap/robots status.
// Saved settings are read at render time by lib/seo.ts and merged into the
// Next.js metadata for the homepage, articles, videos, and categories.

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Save, Search, Globe, Twitter, Tags, FileText, Bot, CheckCircle2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { FileUpload } from '@/components/admin/FileUpload'

interface Status {
  siteUrl: string
  sitemapUrl: string
  robotsUrl: string
  articleCount: number
  videoCount: number
  categoryCount: number
}

export function AdminSeo() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/seo')
      .then((r) => r.json())
      .then((d) => {
        setSettings(d.settings || {})
        setStatus(d.status || null)
      })
      .finally(() => setLoading(false))
  }, [])

  const update = (key: string, value: string) => setSettings((s) => ({ ...s, [key]: value }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const r = await fetch('/api/admin/seo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!r.ok) throw new Error('خطا')
      toast.success('تنظیمات سئو ذخیره شد')
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
            <Search className="h-6 w-6 text-primary" />
            مدیریت سئو
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            تنظیمات متا، OpenGraph، Twitter، JSON-LD و کنترل ایندکس
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

      {/* Status / quick links */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              وضعیت سئو و ایندکس
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatusTile label="آدرس سایت" value={status.siteUrl} href={status.siteUrl} />
            <StatusTile label="نقشه سایت (sitemap)" value={status.sitemapUrl} href={status.sitemapUrl} />
            <StatusTile label="robots.txt" value={status.robotsUrl} href={status.robotsUrl} />
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground text-xs">تعداد ایندکسی‌ها</span>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary">{status.articleCount} خبر</Badge>
                <Badge variant="secondary">{status.videoCount} ویدیو</Badge>
                <Badge variant="secondary">{status.categoryCount} دسته</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Global meta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            متادیتای کلی سایت
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="عنوان پیش‌فرض سایت (Meta Title)" hint="حداکثر ۶۰ کاراکتر. در تب مرورگر و نتایج جستجو نمایش داده می‌شود.">
            <Input value={settings.seo_site_title || ''} onChange={(e) => update('seo_site_title', e.target.value)} />
            <CharCount value={settings.seo_site_title || ''} max={60} />
          </Field>
          <Field label="توضیحات پیش‌فرض (Meta Description)" hint="حداکثر ۱۶۰ کاراکتر. خلاصه‌ای از سایت برای موتورهای جستجو.">
            <Textarea value={settings.seo_site_description || ''} onChange={(e) => update('seo_site_description', e.target.value)} rows={3} />
            <CharCount value={settings.seo_site_description || ''} max={160} />
          </Field>
          <Field label="کلمات کلیدی (با ویرگول)" hint="اختیاری — موتورهای جستجوی مدرن معمولاً نادیده می‌گیرند ولی برخی راهنماها استفاده می‌کنند.">
            <Input value={settings.seo_site_keywords || ''} onChange={(e) => update('seo_site_keywords', e.target.value)} dir="ltr" />
          </Field>
          <Field label="آدرس کانonical (Canonical URL)" hint="آدرس اصلی و ترجیحی سایت. اگر سایت چند دامنه دارد، این را تنظیم کنید.">
            <Input value={settings.seo_canonical_url || ''} onChange={(e) => update('seo_canonical_url', e.target.value)} dir="ltr" placeholder="https://rahkarjavan.ir" />
          </Field>
          <Field label="دستور robots کلی" hint="مثلاً index, follow یا noindex, follow">
            <Input value={settings.seo_robots || ''} onChange={(e) => update('seo_robots', e.target.value)} dir="ltr" placeholder="index, follow" />
          </Field>
        </CardContent>
      </Card>

      {/* Default OG image */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            تصویر اشتراک‌گذاری پیش‌فرض (Open Graph)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            value={settings.seo_default_og_image || ''}
            onChange={(url) => update('seo_default_og_image', url)}
            folder="seo"
            accept="image/*"
            preview="image"
            label=""
            hint="تصویر ۱۲۰۰×۶۳۰ پیکسل. وقتی خبری تصویر OG نداشت، این تصویر در شبکه‌های اجتماعی نمایش داده می‌شود."
          />
        </CardContent>
      </Card>

      {/* OpenGraph */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            تنظیمات OpenGraph
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="نام سایت (og:site_name)">
            <Input value={settings.seo_og_site_name || ''} onChange={(e) => update('seo_og_site_name', e.target.value)} />
          </Field>
          <Field label="زبان (og:locale)">
            <Input value={settings.seo_og_locale || ''} onChange={(e) => update('seo_og_locale', e.target.value)} dir="ltr" placeholder="fa_IR" />
          </Field>
          <Field label="نوع (og:type)">
            <Input value={settings.seo_og_type || ''} onChange={(e) => update('seo_og_type', e.target.value)} dir="ltr" placeholder="website" />
          </Field>
        </CardContent>
      </Card>

      {/* Twitter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Twitter className="h-4 w-4 text-primary" />
            کارت توییتر / X
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="نوع کارت (twitter:card)" hint="summary یا summary_large_image یا player">
            <Input value={settings.seo_twitter_card || ''} onChange={(e) => update('seo_twitter_card', e.target.value)} dir="ltr" placeholder="summary_large_image" />
          </Field>
          <Field label="حساب سایت (twitter:site)" hint="با @ شروع شود">
            <Input value={settings.seo_twitter_site || ''} onChange={(e) => update('seo_twitter_site', e.target.value)} dir="ltr" placeholder="@rahkarjavan" />
          </Field>
          <Field label="سازنده (twitter:creator)">
            <Input value={settings.seo_twitter_creator || ''} onChange={(e) => update('seo_twitter_creator', e.target.value)} dir="ltr" placeholder="@username" />
          </Field>
        </CardContent>
      </Card>

      {/* JSON-LD */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tags className="h-4 w-4 text-primary" />
            داده‌های ساختاریافته (JSON-LD)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="نام سازمان (Organization name)">
            <Input value={settings.seo_org_name || ''} onChange={(e) => update('seo_org_name', e.target.value)} />
          </Field>
          <Field label="لوگوی سازمان (URL)">
            <Input value={settings.seo_org_logo || ''} onChange={(e) => update('seo_org_logo', e.target.value)} dir="ltr" />
          </Field>
          <Field label="پروفایل‌های مرتبط (sameAs)" hint="با ویرگول جدا کنید. لینک به شبکه‌های اجتماعی و ویکی‌پدیا.">
            <Textarea value={settings.seo_org_same_as || ''} onChange={(e) => update('seo_org_same_as', e.target.value)} rows={2} dir="ltr" placeholder="https://twitter.com/..., https://instagram.com/..." />
          </Field>
        </CardContent>
      </Card>

      {/* Indexing controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            کنترل ایندکس شدن
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <IndexToggle
            label="ایندکس اخبار/مقالات"
            hint="اجازه ایندکس شدن صفحات اخبار در موتورهای جستجو"
            value={settings.seo_index_articles !== 'false'}
            onChange={(v) => update('seo_index_articles', v ? 'true' : 'false')}
          />
          <IndexToggle
            label="ایندکس ویدیوها"
            hint="اجازه ایندکس شدن صفحات ویدیو در موتورهای جستجو"
            value={settings.seo_index_videos !== 'false'}
            onChange={(v) => update('seo_index_videos', v ? 'true' : 'false')}
          />
          <IndexToggle
            label="ایندکس دسته‌بندی‌ها"
            hint="اجازه ایندکس شدن صفحات دسته‌بندی"
            value={settings.seo_index_categories !== 'false'}
            onChange={(v) => update('seo_index_categories', v ? 'true' : 'false')}
          />
          <IndexToggle
            label="ایندکس صفحه اصلی"
            hint="اجازه ایندکس شدن صفحه اصلی"
            value={settings.seo_index_homepage !== 'false'}
            onChange={(v) => update('seo_index_homepage', v ? 'true' : 'false')}
          />
        </CardContent>
      </Card>

      {/* robots.txt extra */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            مسیرهای اضافی ممنوع در robots.txt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Field label="Disallow اضافه (هر خط یک مسیر)" hint="مسیرهایی که نمی‌خواهید ربات‌ها ایندکس کنند. به‌طور خودکار /api/ و /admin بسته شده‌اند.">
            <Textarea
              value={settings.seo_robots_extra_disallow || ''}
              onChange={(e) => update('seo_robots_extra_disallow', e.target.value)}
              rows={3}
              dir="ltr"
              placeholder="/private/&#10;/temp/"
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? 'در حال ذخیره...' : (
            <>
              <Save className="h-4 w-4 ml-1" />
              ذخیره تنظیمات سئو
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

function CharCount({ value, max }: { value: string; max: number }) {
  const over = value.length > max
  return (
    <p className={`text-[10px] ${over ? 'text-destructive' : 'text-muted-foreground'}`}>
      {value.length} / {max} کاراکتر {over && '(بیش از حد)'}
    </p>
  )
}

function IndexToggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer p-2 rounded-md hover:bg-secondary/40">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </label>
  )
}

function StatusTile({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <span className="text-muted-foreground text-xs">{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary text-xs hover:underline inline-flex items-center gap-1 break-all">
          <ExternalLink className="h-3 w-3 shrink-0" />
          {value}
        </a>
      ) : (
        <span className="text-foreground text-xs break-all">{value}</span>
      )}
    </div>
  )
}
