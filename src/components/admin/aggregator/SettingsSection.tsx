// SettingsSection.tsx — global aggregator settings + cron secret reminder
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { formatPersianNumber, toPersianDigits } from '@/lib/utils'
import { Save, Loader2, Terminal, Key, Video, ImageIcon } from 'lucide-react'

interface Settings {
  siteName: string
  minContentLength: number
  requestDelayMs: number
  fetchTimeoutMs: number
  fetchRetries: number
  userAgent: string
  maxConsecutiveFailures: number
  autoDisableHours: number
  defaultIntervalMinutes: number
  defaultMaxItemsPerRun: number
  importVideos: boolean
  importImages: boolean
  latestOnly: boolean
}

export function SettingsSection() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [saving, setSaving] = useState(false)
  const [cronSecret, setCronSecret] = useState('')

  useEffect(() => {
    fetch('/api/admin/aggregator/settings').then((r) => r.json()).then((d) => setSettings(d.settings))
  }, [])

  const save = async () => {
    if (!settings) return
    setSaving(true)
    try {
      await fetch('/api/admin/aggregator/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      toast.success('تنظیمات ذخیره شد')
    } catch { toast.error('خطا') }
    finally { setSaving(false) }
  }

  if (!settings) return <Skeleton className="h-64 w-full" />

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setSettings({ ...settings!, [k]: v })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">تنظیمات سراسری</h2>
        <p className="text-sm text-muted-foreground mt-1">
          این مقادیر برای همه منابع اعمال می‌شوند مگر اینکه هر منبع مقدار خودش را داشته باشد.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>پارامترها</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldRow label="نام سایت ما (برای نمایش در منبع)">
            <Input value={settings.siteName} onChange={(e) => set('siteName', e.target.value)} dir="rtl" />
          </FieldRow>
          <FieldRow label="حداقل طول متن (کاراکتر)">
            <Input type="number" min={50} max={10000} value={settings.minContentLength}
              onChange={(e) => set('minContentLength', +e.target.value)} dir="ltr" />
          </FieldRow>
          <FieldRow label="تأخیر بین درخواست‌ها (ms)">
            <Input type="number" min={0} max={60000} value={settings.requestDelayMs}
              onChange={(e) => set('requestDelayMs', +e.target.value)} dir="ltr" />
          </FieldRow>
          <FieldRow label="مهلت fetch (ms)">
            <Input type="number" min={1000} max={120000} value={settings.fetchTimeoutMs}
              onChange={(e) => set('fetchTimeoutMs', +e.target.value)} dir="ltr" />
          </FieldRow>
          <FieldRow label="تعداد retry">
            <Input type="number" min={0} max={10} value={settings.fetchRetries}
              onChange={(e) => set('fetchRetries', +e.target.value)} dir="ltr" />
          </FieldRow>
          <FieldRow label="User-Agent">
            <Input value={settings.userAgent} onChange={(e) => set('userAgent', e.target.value)} dir="ltr" />
          </FieldRow>
          <FieldRow label="حداکثر خطای متوالی پیش از غیرفعال‌سازی خودکار">
            <Input type="number" min={1} max={50} value={settings.maxConsecutiveFailures}
              onChange={(e) => set('maxConsecutiveFailures', +e.target.value)} dir="ltr" />
          </FieldRow>
          <FieldRow label="ساعات غیرفعال ماندن بعد از خطای زیاد">
            <Input type="number" min={1} max={168} value={settings.autoDisableHours}
              onChange={(e) => set('autoDisableHours', +e.target.value)} dir="ltr" />
          </FieldRow>
          <FieldRow label="بازه پیش‌فرض (دقیقه)">
            <Input type="number" min={1} max={1440} value={settings.defaultIntervalMinutes}
              onChange={(e) => set('defaultIntervalMinutes', +e.target.value)} dir="ltr" />
          </FieldRow>
          <FieldRow label="حداکثر خبر پیش‌فرض در هر اجرا">
            <Input type="number" min={1} max={200} value={settings.defaultMaxItemsPerRun}
              onChange={(e) => set('defaultMaxItemsPerRun', +e.target.value)} dir="ltr" />
          </FieldRow>
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <Save className="h-4 w-4 ml-1" />}
              ذخیره تنظیمات
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-4 w-4" /> مسیریابی رسانه (ویدیو / عکس)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm leading-relaxed">
            <strong>قانون:</strong> هر صفحه‌ی خبری حداقل باید یک عکس داشته باشد تا وارد شود.
            اگر این گزینه <strong>روشن</strong> باشد، صفحاتی که ویدیو جاسازی‌شده دارند به‌عنوان
            «ویدیو» ذخیره می‌شوند؛ اگر <strong>خاموش</strong> باشد، ویدیوها نادیده گرفته می‌شوند و
            فقط صفحات عکس‌دار به‌عنوان مقاله‌ی مجله وارد می‌شوند.
          </div>
          <FieldRow label="وارد کردن ویدیوها (در صورت خاموش بودن، فقط خبرهای عکس‌دار وارد می‌شوند)">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => set('importVideos', !settings.importVideos)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.importVideos ? 'bg-primary' : 'bg-muted'}`}
                aria-pressed={settings.importVideos}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.importVideos ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm text-muted-foreground">
                {settings.importVideos
                  ? '✓ فعال — ویدیوها وارد می‌شوند'
                  : '✗ غیرفعال — فقط عکس‌دار (پیشنهاد فعلی به‌خاطر محدودیت رم)'}
              </span>
            </div>
          </FieldRow>

          {/* Image importing — text-only mode the client requested */}
          <FieldRow label="وارد کردن تصاویر (خاموش = حالت «فقط متن» بدون عکس)">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => set('importImages', !settings.importImages)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.importImages ? 'bg-primary' : 'bg-muted'}`}
                aria-pressed={settings.importImages}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.importImages ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm text-muted-foreground">
                {settings.importImages
                  ? '✓ فعال — تصاویر اصلی کپی و روی سرور ما ذخیره می‌شوند'
                  : '✗ غیرفعال — فقط متن خبر وارد می‌شود (پیشنهاد کارفرما برای جلوگیری از کپی‌رایت تصاویر)'}
              </span>
            </div>
          </FieldRow>
          <p className="text-xs text-muted-foreground leading-6 bg-muted/40 rounded-md p-3">
            <ImageIcon className="h-3.5 w-3.5 inline-block ml-1" />
            در حالت «فقط متن»، خبر با همان متن اصلی منبع (کپی‌پیست) ذخیره می‌شود، بدون تصویر.
            ابتدای متن پیشوند منبع (مثلاً «فارس:») و انتهای آن خط «منبع: … — لینک» اضافه می‌شود.
          </p>

          {/* Latest-only mode — keep the home ticker fresh */}
          <FieldRow label="فقط آخرین خبرها (حالت تازه‌نگه‌داشتن نوار «آخرین خبرها»)">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => set('latestOnly', !settings.latestOnly)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.latestOnly ? 'bg-primary' : 'bg-muted'}`}
                aria-pressed={settings.latestOnly}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.latestOnly ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm text-muted-foreground">
                {settings.latestOnly
                  ? '✓ فعال — فقط جدیدترین خبر هر منبع وارد می‌شود (نوار «آخرین خبرها» همیشه تازه می‌ماند)'
                  : '✗ غیرفعال — کل آرشیو منبع به‌تدریج وارد می‌شود'}
              </span>
            </div>
          </FieldRow>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <Save className="h-4 w-4 ml-1" />}
              ذخیره تنظیمات
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Terminal className="h-4 w-4" /> راه‌اندازی cron</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            برای پایداری در محیط production، یک سرویس cron بیرونی را تنظیم کن که هر دقیقه (یا هر چند دقیقه)
            به <code dir="ltr" className="text-foreground">/api/cron/crawl</code> درخواست بزند. این endpoint
            با متغیر محیطی <code dir="ltr" className="text-foreground">CRON_SECRET</code> محافظت می‌شود.
          </p>
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1"><Key className="h-3 w-3" /> CRON_SECRET (از .env)</Label>
            <Input
              type="text"
              placeholder="برای دیدن رشته cron لینوکس، CRON_SECRET را وارد کن"
              value={cronSecret}
              onChange={(e) => setCronSecret(e.target.value)}
              dir="ltr"
            />
            {cronSecret && (
              <div className="rounded-md border bg-muted p-3 text-xs space-y-2" dir="ltr">
                <p className="text-muted-foreground"># Linux crontab (every minute):</p>
                <code className="block break-all">
                  * * * * * curl -s -X POST -H "Authorization: Bearer {cronSecret}" https://your-domain/api/cron/crawl {'>'} /dev/null
                </code>
                <p className="text-muted-foreground mt-2"># or via query string (for Vercel Cron):</p>
                <code className="block break-all">
                  curl -s https://your-domain/api/cron/crawl?secret={cronSecret}
                </code>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
      <Label className="text-sm">{label}</Label>
      <div>{children}</div>
    </div>
  )
}
