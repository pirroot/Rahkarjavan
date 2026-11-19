// SourcesSection.tsx — manage NewsSource list + create/edit dialog + test + run
'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { formatPersianNumber, timeAgo, toPersianDigits } from '@/lib/utils'
import {
  Plus, Pencil, Trash2, Play, FlaskConical, RefreshCw, Loader2, Power, PowerOff, ExternalLink,
} from 'lucide-react'

interface Category { id: string; name: string }
interface Source {
  id: string; name: string; isActive: boolean;
  rssUrl: string | null; listingUrl: string | null; linkSelector: string | null;
  useSitemap: boolean;
  titleSelector: string | null; bodySelector: string | null;
  imageSelector: string | null; dateSelector: string | null; categorySelector: string | null;
  removeSelectors: string[];
  defaultCategoryId: string | null;
  categoryMap: Record<string, string>;
  videoCategoryId: string | null;
  autoPublishVideo: boolean;
  autoPublish: boolean; useOriginalDate: boolean; addSourceCredit: boolean;
  maxItemsPerRun: number; intervalMinutes: number; respectRobots: boolean;
  consecutiveFailures: number; autoDisabledAt: string | null;
  lastRunAt: string | null; lastStatus: string | null; lastError: string | null;
  _count?: { articles: number; crawlLogs: number };
}

interface Props { categories: Category[] }

export function SourcesSection({ categories }: Props) {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<Source | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Source | null>(null)
  const [running, setRunning] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/aggregator/sources').then((r) => r.json())
      setSources(r.sources || [])
    } catch { toast.error('خطا در دریافت منابع') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const toggleActive = async (s: Source) => {
    try {
      await fetch('/api/admin/aggregator/sources/' + s.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...s, isActive: !s.isActive }),
      })
      toast.success(s.isActive ? 'منبع غیرفعال شد' : 'منبع فعال شد')
      load()
    } catch { toast.error('خطا') }
  }

  const runSource = async (s: Source) => {
    setRunning(s.id)
    try {
      const r = await fetch('/api/admin/aggregator/run', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId: s.id }),
      }).then((r) => r.json())
      const res = r.results?.[0]
      if (!res) { toast.error('پاسخ خالی'); return }
      toast.success(
        `پیدا: ${toPersianDigits(res.found)} | وارد: ${toPersianDigits(res.created)} | ردشده: ${toPersianDigits(res.skipped)} | خطا: ${toPersianDigits(res.failed)}`,
      )
      load()
    } catch { toast.error('خطا در اجرا') }
    finally { setRunning(null) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">منابع خبر</h2>
        <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditing(null) }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 ml-1" /> افزودن منبع</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'ویرایش منبع' : 'افزودن منبع جدید'}</DialogTitle>
            </DialogHeader>
            <SourceForm
              key={editing?.id || 'new'}
              initial={editing}
              categories={categories}
              onCancel={() => { setEditOpen(false); setEditing(null) }}
              onSaved={() => { setEditOpen(false); setEditing(null); load() }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : sources.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-lg">
          <p className="text-muted-foreground">هنوز منبعی ثبت نشده. روی «افزودن منبع» بزن.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام منبع</TableHead>
                <TableHead>روش کشف</TableHead>
                <TableHead>مسیریابی</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>بازه</TableHead>
                <TableHead>آخرین اجرا</TableHead>
                <TableHead>اخبار</TableHead>
                <TableHead className="text-left">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">
                      {s.rssUrl ? 'RSS' : s.listingUrl ? 'Listing' : s.useSitemap ? 'Sitemap' : '—'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">مقاله</Badge>
                      {s.videoCategoryId && <Badge variant="default" className="text-[10px] bg-blue-600 hover:bg-blue-600">ویدیو</Badge>}
                      {!s.videoCategoryId && !s.defaultCategoryId && (
                        <Badge variant="destructive" className="text-[10px]">بدون دسته!</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {s.isActive ? (
                      <Badge variant="default" className="bg-green-600 hover:bg-green-600">فعال</Badge>
                    ) : s.autoDisabledAt ? (
                      <Badge variant="destructive">غیرفعال (خطای زیاد)</Badge>
                    ) : (
                      <Badge variant="secondary">غیرفعال</Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatPersianNumber(s.intervalMinutes)} دقیقه</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {s.lastRunAt ? (
                      <span>
                        {timeAgo(new Date(s.lastRunAt))}
                        <span className="text-muted-foreground/60"> — </span>
                        {s.lastStatus === 'OK' ? '✓' : s.lastStatus === 'FAILED' ? '✗' : '…'}
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell>{formatPersianNumber(s._count?.articles ?? 0)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(s); setEditOpen(true) }} title="ویرایش">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => runSource(s)}
                        disabled={running === s.id} title="اجرای دستی">
                        {running === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleActive(s)} title={s.isActive ? 'غیرفعال کردن' : 'فعال کردن'}>
                        {s.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(s)} title="حذف">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف منبع</AlertDialogTitle>
            <AlertDialogDescription>
              مطمئنی؟ خبرهای وارد‌شده از این منبع روی سایت باقی می‌مانند اما دیگر به آن منبع متصل نخواهند بود.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteTarget) return
                await fetch('/api/admin/aggregator/sources/' + deleteTarget.id, { method: 'DELETE' })
                toast.success('منبع حذف شد')
                setDeleteTarget(null)
                load()
              }}
            >حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ---------- Source form (with tabs: discovery, selectors, publish) ----------

interface SourceFormProps {
  initial: Source | null
  categories: Category[]
  onCancel: () => void
  onSaved: () => void
}

function SourceForm({ initial, categories, onCancel, onSaved }: SourceFormProps) {
  const [name, setName] = useState(initial?.name || '')
  const [isActive, setIsActive] = useState(initial?.isActive ?? true)
  const [rssUrl, setRssUrl] = useState(initial?.rssUrl || '')
  const [listingUrl, setListingUrl] = useState(initial?.listingUrl || '')
  const [linkSelector, setLinkSelector] = useState(initial?.linkSelector || '')
  const [useSitemap, setUseSitemap] = useState(initial?.useSitemap ?? false)
  const [titleSelector, setTitleSelector] = useState(initial?.titleSelector || '')
  const [bodySelector, setBodySelector] = useState(initial?.bodySelector || '')
  const [imageSelector, setImageSelector] = useState(initial?.imageSelector || '')
  const [dateSelector, setDateSelector] = useState(initial?.dateSelector || '')
  const [categorySelector, setCategorySelector] = useState(initial?.categorySelector || '')
  const [removeSelectors, setRemoveSelectors] = useState((initial?.removeSelectors || []).join('\n'))
  const [defaultCategoryId, setDefaultCategoryId] = useState(initial?.defaultCategoryId || '')
  const [videoCategoryId, setVideoCategoryId] = useState(initial?.videoCategoryId || '')
  const [autoPublish, setAutoPublish] = useState(initial?.autoPublish ?? true)
  const [autoPublishVideo, setAutoPublishVideo] = useState(initial?.autoPublishVideo ?? true)
  const [useOriginalDate, setUseOriginalDate] = useState(initial?.useOriginalDate ?? true)
  const [addSourceCredit, setAddSourceCredit] = useState(initial?.addSourceCredit ?? true)
  const [maxItemsPerRun, setMaxItemsPerRun] = useState(initial?.maxItemsPerRun ?? 20)
  const [intervalMinutes, setIntervalMinutes] = useState(initial?.intervalMinutes ?? 20)
  const [respectRobots, setRespectRobots] = useState(initial?.respectRobots ?? true)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setSaving(true)
    try {
      const body = {
        name, isActive,
        rssUrl, listingUrl, linkSelector, useSitemap,
        titleSelector, bodySelector, imageSelector, dateSelector, categorySelector,
        removeSelectors: removeSelectors.split('\n').map((s) => s.trim()).filter(Boolean),
        defaultCategoryId: defaultCategoryId || null,
        categoryMap: {},
        videoCategoryId: videoCategoryId || null,
        autoPublishVideo,
        autoPublish, useOriginalDate, addSourceCredit,
        maxItemsPerRun, intervalMinutes, respectRobots,
      }
      const url = initial
        ? '/api/admin/aggregator/sources/' + initial.id
        : '/api/admin/aggregator/sources'
      const r = await fetch(url, {
        method: initial ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) {
        const e = await r.json()
        toast.error(e.error || 'خطا در ذخیره')
        return
      }
      toast.success(initial ? 'منبع به‌روزرسانی شد' : 'منبع ساخته شد')
      onSaved()
    } catch (e) { toast.error('خطا') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="discovery">
        <TabsList className="w-full">
          <TabsTrigger value="discovery">کشف</TabsTrigger>
          <TabsTrigger value="selectors">سلکتورها</TabsTrigger>
          <TabsTrigger value="publish">انتشار</TabsTrigger>
        </TabsList>

        {/* Discovery */}
        <TabsContent value="discovery" className="space-y-3 pt-3">
          <Field label="نام منبع" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً خبرگزاری ایسنا" />
          </Field>
          <Field label="آدرس RSS/Atom (اولویت اول)">
            <Input value={rssUrl} onChange={(e) => setRssUrl(e.target.value)} placeholder="https://example.com/rss" dir="ltr" />
          </Field>
          <Field label="آدرس لیست خبرها (اگر RSS نبود)">
            <Input value={listingUrl} onChange={(e) => setListingUrl(e.target.value)} placeholder="https://example.com/news" dir="ltr" />
          </Field>
          <Field label="سلکتور CSS لینک خبرها در صفحه لیست">
            <Input value={linkSelector} onChange={(e) => setLinkSelector(e.target.value)} placeholder="a.news-link, article h3 a" dir="ltr" />
          </Field>
          <Field label="استفاده از sitemap.xml اگر دو روش بالا جواب نداد">
            <Switch checked={useSitemap} onCheckedChange={setUseSitemap} />
          </Field>
        </TabsContent>

        {/* Selectors */}
        <TabsContent value="selectors" className="space-y-3 pt-3">
          <p className="text-xs text-muted-foreground">
            سلکتورهای CSS اختیاری‌اند. اگر خالی بگذاری، از Readability و Open Graph متا استفاده می‌شود.
          </p>
          <Field label="عنوان"><Input value={titleSelector} onChange={(e) => setTitleSelector(e.target.value)} dir="ltr" placeholder="h1.article-title" /></Field>
          <Field label="بدنه"><Input value={bodySelector} onChange={(e) => setBodySelector(e.target.value)} dir="ltr" placeholder=".article-body, article" /></Field>
          <Field label="تصویر شاخص"><Input value={imageSelector} onChange={(e) => setImageSelector(e.target.value)} dir="ltr" placeholder=".article-image img" /></Field>
          <Field label="تاریخ"><Input value={dateSelector} onChange={(e) => setDateSelector(e.target.value)} dir="ltr" placeholder="time[datetime], .article-date" /></Field>
          <Field label="دسته‌بندی"><Input value={categorySelector} onChange={(e) => setCategorySelector(e.target.value)} dir="ltr" placeholder=".breadcrumb .category" /></Field>
          <Field label="عناصر مزاحم برای حذف (هر خط یک سلکتور)">
            <Textarea rows={4} value={removeSelectors} onChange={(e) => setRemoveSelectors(e.target.value)} dir="ltr" placeholder=".related&#10;.social-share&#10;.newsletter" />
          </Field>
        </TabsContent>

        {/* Publish */}
        <TabsContent value="publish" className="space-y-3 pt-3">
          <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs leading-relaxed">
            <strong>قانون مسیریابی:</strong> اگر صفحه حاوی ویدیو (ویدیو جاسازی‌شده، YouTube، آپارات، Vimeo یا mp4 مستقیم) باشد
            → به‌عنوان <strong>ویدیو</strong> ذخیره می‌شود. اگر فقط عکس داشته باشد → به‌عنوان <strong>مقاله مجله</strong>.
            اگر نه ویدیو و نه عکس داشته باشد → رد می‌شود.
          </div>
          <Field label="دسته‌بندی پیش‌فرض برای خبرها (مقالات مجله)">
            <Select value={defaultCategoryId} onValueChange={setDefaultCategoryId}>
              <SelectTrigger><SelectValue placeholder="بدون دسته" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="دسته‌بندی برای ویدیوها (وقتی صفحه ویدیو دارد)">
            <Select value={videoCategoryId} onValueChange={setVideoCategoryId}>
              <SelectTrigger><SelectValue placeholder="همان دسته پیش‌فرض" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="انتشار خودکار مقالات (false = ذخیره به‌عنوان پیش‌نویس)">
            <Switch checked={autoPublish} onCheckedChange={setAutoPublish} />
          </Field>
          <Field label="انتشار خودکار ویدیوها">
            <Switch checked={autoPublishVideo} onCheckedChange={setAutoPublishVideo} />
          </Field>
          <Field label="استفاده از تاریخ اصلی خبر (false = زمان درج) ">
            <Switch checked={useOriginalDate} onCheckedChange={setUseOriginalDate} />
          </Field>
          <Field label="افزودن خط «منبع: نام — لینک» در پایان متن">
            <Switch checked={addSourceCredit} onCheckedChange={setAddSourceCredit} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="حداکثر خبر در هر اجرا">
              <Input type="number" min={1} max={200} value={maxItemsPerRun} onChange={(e) => setMaxItemsPerRun(+e.target.value)} dir="ltr" />
            </Field>
            <Field label="بازه اجرا (دقیقه)">
              <Input type="number" min={1} max={1440} value={intervalMinutes} onChange={(e) => setIntervalMinutes(+e.target.value)} dir="ltr" />
            </Field>
          </div>
          <Field label="رعایت robots.txt">
            <Switch checked={respectRobots} onCheckedChange={setRespectRobots} />
          </Field>
          <Field label="منبع فعال">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </Field>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between gap-2 pt-4 border-t">
        <Button variant="ghost" onClick={onCancel}>انصراف</Button>
        <Button onClick={submit} disabled={saving || !name.trim()}>
          {saving ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : null}
          ذخیره
        </Button>
      </div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </Label>
      {children}
    </div>
  )
}

export { FlaskConical, RefreshCw, ExternalLink }
