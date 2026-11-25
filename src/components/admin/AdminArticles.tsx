'use client'

import { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from '@/components/admin/FileUpload'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { Plus, Pencil, Trash2, Star, Eye, Newspaper, AlertCircle, Sparkles, ExternalLink, Search, Search as SearchIcon, Calendar, Eye as PreviewEye, Clock } from 'lucide-react'
import { formatPersianNumber, articleStatusLabels, timeAgo } from '@/lib/utils'
import { markdownToHtml, htmlToMarkdown, calculateReadingTime, generateMetaDescription, generateSlug } from '@/lib/markdown'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

export function AdminArticles() {
  const [articles, setArticles] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/articles').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
    ]).then(([a, c]) => {
      setArticles(a.articles || [])
      setCategories(c.categories || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const handleSave = async (data: any) => {
    try {
      if (editing) {
        const r = await fetch(`/api/admin/articles/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!r.ok) {
          const j = await r.json()
          throw new Error(j.error || 'خطا')
        }
        toast.success('مطلب به‌روزرسانی شد')
      } else {
        const r = await fetch('/api/admin/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!r.ok) {
          const j = await r.json()
          throw new Error(j.error || 'خطا')
        }
        toast.success('مطلب با موفقیت ایجاد شد')
      }
      setOpen(false)
      setEditing(null)
      loadData()
    } catch (e: any) {
      toast.error(e.message || 'خطا در ذخیره‌سازی')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const r = await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error('خطا')
      toast.success('مطلب حذف شد')
      loadData()
    } catch {
      toast.error('خطا در حذف')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">مدیریت اخبار و مقالات</h1>
          <p className="text-sm text-muted-foreground">مدیریت تمام مطالب مجله خبری</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null) }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-1" />
              افزودن خبر
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-y-auto p-6 sm:p-8">
            <DialogHeader className="pb-4 border-b border-border sticky top-0 bg-background z-10">
              <DialogTitle className="text-xl">{editing ? 'ویرایش مطلب' : 'افزودن مطلب جدید'}</DialogTitle>
            </DialogHeader>
            <div className="pt-4">
              <ArticleForm
                initial={editing}
                categories={categories}
                onSave={handleSave}
                onCancel={() => { setOpen(false); setEditing(null) }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16">
          <Newspaper className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">مطبی ثبت نشده</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>عنوان</TableHead>
                <TableHead>دسته</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>منبع</TableHead>
                <TableHead>بازدید</TableHead>
                <TableHead>ویژه</TableHead>
                <TableHead>تاریخ</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((a, i) => (
                <TableRow key={a.id}>
                  <TableCell className="text-muted-foreground">{formatPersianNumber(i + 1)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-md bg-secondary overflow-hidden shrink-0">
                        <img src={a.coverImage} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground line-clamp-1 max-w-xs">{a.title}</p>
                        {a.author && <p className="text-xs text-muted-foreground">{a.author.displayName || a.author.name}</p>}
                      </div>
                      {a.isBreaking && <AlertCircle className="h-4 w-4 text-destructive" />}
                    </div>
                  </TableCell>
                  <TableCell>{a.category?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={a.status === 'PUBLISHED' ? 'default' : a.status === 'DRAFT' ? 'secondary' : 'outline'}>
                      {articleStatusLabels[a.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {a.sourceName ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-foreground flex items-center gap-1">
                          {a.aiGenerated && <Sparkles className="h-3 w-3 text-primary" />}
                          {a.sourceName}
                        </span>
                        {a.sourceUrl && (
                          <a href={a.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5">
                            <ExternalLink className="h-2.5 w-2.5" />
                            منبع
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">تألیفی</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-xs">
                      <Eye className="h-3 w-3" />
                      {formatPersianNumber(a.views)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {a.isFeatured ? (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{timeAgo(a.publishedAt || a.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(a); setOpen(true) }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف مطلب</AlertDialogTitle>
                            <AlertDialogDescription>
                              آیا از حذف مطلب «{a.title}» مطمئن هستید؟ این عمل قابل بازگشت نیست.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>انصراف</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(a.id)}>حذف</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function ArticleForm({ initial, categories, onSave, onCancel }: {
  initial: any | null
  categories: any[]
  onSave: (data: any) => void
  onCancel: () => void
}) {
  // The editor stores content as Markdown (RichTextEditor is MDX-based). We
  // convert HTML ↔ Markdown so existing articles (stored as HTML) open in the
  // editor cleanly, and on save we convert Markdown → HTML for storage.
  const [form, setForm] = useState({
    title: initial?.title || '',
    titleEn: initial?.titleEn || '',
    slug: initial?.slug || '',
    excerpt: initial?.excerpt || '',
    // Edit-time content is markdown. Convert from HTML on load.
    contentMd: initial?.content ? htmlToMarkdown(initial.content) : '',
    coverImage: initial?.coverImage || '',
    categoryId: initial?.categoryId || '',
    tags: initial?.tags || '',
    isFeatured: initial?.isFeatured ?? false,
    isPublished: initial?.isPublished ?? true,
    isBreaking: initial?.isBreaking ?? false,
    status: initial?.status || 'PUBLISHED',
    publishedAt: initial?.publishedAt
      ? new Date(initial.publishedAt).toISOString().slice(0, 16)
      : '',
    // SEO fields
    metaTitle: initial?.metaTitle || '',
    metaDescription: initial?.metaDescription || '',
    ogImage: initial?.ogImage || '',
  })
  const [tab, setTab] = useState<'content' | 'seo' | 'preview'>('content')

  // Auto-fill meta fields when content/title changes (only when empty).
  const readingTime = useMemo(
    () => calculateReadingTime(markdownToHtml(form.contentMd)),
    [form.contentMd]
  )
  const autoMetaDescription = useMemo(
    () => form.metaDescription || form.excerpt || generateMetaDescription(markdownToHtml(form.contentMd)),
    [form.contentMd, form.excerpt, form.metaDescription]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('عنوان الزامی است')
      return
    }
    if (!form.excerpt.trim()) {
      toast.error('خلاصه الزامی است')
      return
    }
    if (!form.contentMd.trim()) {
      toast.error('محتوا الزامی است')
      return
    }
    if (form.status === 'SCHEDULED' && !form.publishedAt) {
      toast.error('برای انتشار زمان‌بندی‌شده، تاریخ انتشار را وارد کنید')
      return
    }
    // Convert markdown → HTML for storage. The backend already does this on
    // create/update, but we send HTML so the value round-trips cleanly when
    // the admin reopens the article.
    const html = markdownToHtml(form.contentMd)
    onSave({
      ...form,
      content: html,
      slug: form.slug || generateSlug(form.title),
      metaTitle: form.metaTitle || form.title.slice(0, 60),
      metaDescription: autoMetaDescription,
      ogImage: form.ogImage || form.coverImage,
      readingTime,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Top row: title + slug */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>عنوان *</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="عنوان خبر..." />
        </div>
        <div className="space-y-1.5">
          <Label>Slug (URL)</Label>
          <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} dir="ltr" placeholder="خالی=خودکار" />
        </div>
      </div>

      {/* Excerpt */}
      <div className="space-y-1.5">
        <Label>خلاصه *</Label>
        <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} required placeholder="یک خط خلاصه که در کارت خبر و نتایج جستجو نمایش داده می‌شود" />
      </div>

      {/* Featured image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>تصویر شاخص (کاور)</Label>
          <FileUpload
            value={form.coverImage}
            onChange={(url) => setForm({ ...form, coverImage: url })}
            folder="covers"
            accept="image/*"
            preview="image"
            label=""
            hint="حداکثر ۱۰ مگابایت - JPG, PNG, WebP"
          />
        </div>
        <div className="space-y-1.5">
          <Label>مدت زمان مطالعه (تخمینی)</Label>
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/50 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {formatPersianNumber(readingTime)} دقیقه
          </div>
          <p className="text-xs text-muted-foreground">به‌طور خودکار از روی محتوا محاسبه می‌شود.</p>
        </div>
      </div>

      {/* Tabs: Content | SEO | Preview */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content"><Newspaper className="h-3.5 w-3.5 ml-1" />محتوا</TabsTrigger>
          <TabsTrigger value="seo"><Search className="h-3.5 w-3.5 ml-1" />سئو</TabsTrigger>
          <TabsTrigger value="preview"><PreviewEye className="h-3.5 w-3.5 ml-1" />پیش‌نمایش</TabsTrigger>
        </TabsList>

        {/* Content tab — RichTextEditor */}
        <TabsContent value="content" className="space-y-1.5 mt-3">
          <Label>محتوای مطلب</Label>
          <RichTextEditor
            value={form.contentMd}
            onChange={(md) => setForm({ ...form, contentMd: md })}
            placeholder="محتوای مطلب را اینجا بنویسید... (تیتر، پاراگراف، لیست، تصویر، لینک و جدول پشتیبانی می‌شود)"
            className="min-h-[520px]"
          />
          <p className="text-xs text-muted-foreground">
            متن با ویرایشگر غنی نوشته می‌شود. تصاویر از طریق دکمه تصویر در نوار ابزار آپلود می‌شوند.
          </p>
        </TabsContent>

        {/* SEO tab */}
        <TabsContent value="seo" className="space-y-4 mt-3">
          <div className="space-y-1.5">
            <Label>عنوان سئو (Meta Title)</Label>
            <Input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} placeholder={form.title.slice(0, 60) || 'خالی=استفاده از عنوان'} />
            <CharCount value={form.metaTitle} max={60} />
          </div>
          <div className="space-y-1.5">
            <Label>توضیحات متا (Meta Description)</Label>
            <Textarea value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} rows={2} placeholder={autoMetaDescription || 'خالی=استفاده از خلاصه یا محتوا'} />
            <CharCount value={form.metaDescription || autoMetaDescription} max={160} />
          </div>
          <div className="space-y-1.5">
            <Label>تصویر اشتراک‌گذاری (OG Image)</Label>
            <FileUpload
              value={form.ogImage}
              onChange={(url) => setForm({ ...form, ogImage: url })}
              folder="og"
              accept="image/*"
              preview="image"
              label=""
              hint="اختیاری — خالی=استفاده از تصویر کاور. ابعاد پیشنهادی ۱۲۰۰×۶۳۰"
            />
          </div>
        </TabsContent>

        {/* Preview tab */}
        <TabsContent value="preview" className="mt-3">
          <div className="rounded-md border border-border bg-background overflow-hidden">
            {form.coverImage && (
              <img src={form.coverImage} alt="" className="w-full max-h-[280px] object-cover" />
            )}
            <div className="p-5 space-y-3">
              <h1 className="text-2xl font-bold text-foreground">{form.title || 'عنوان خبر'}</h1>
              {form.excerpt && <p className="text-muted-foreground">{form.excerpt}</p>}
              <div
                className="prose prose-sm sm:prose-base max-w-none text-foreground/90 leading-8"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(form.contentMd) || '<p class="text-muted-foreground">محتوایی نوشته نشده است.</p>' }}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Category / status / tags */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>دسته‌بندی</Label>
          <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
            <SelectTrigger><SelectValue placeholder="انتخاب..." /></SelectTrigger>
            <SelectContent>
              {categories.filter((c) => c.type === 'ARTICLE' || c.type === 'BOTH').map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>وضعیت</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(articleStatusLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>برچسب‌ها (با ویرگول)</Label>
          <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="تگ۱,تگ۲,تگ۳" />
        </div>
      </div>

      {/* Scheduled date picker — shown only when status=SCHEDULED */}
      {form.status === 'SCHEDULED' && (
        <div className="space-y-1.5 p-3 rounded-md bg-primary/5 border border-primary/20">
          <Label className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />تاریخ و ساعت انتشار</Label>
          <Input
            type="datetime-local"
            value={form.publishedAt}
            onChange={(e) => setForm({ ...form, publishedAt: e.target.value })}
            dir="ltr"
          />
          <p className="text-xs text-muted-foreground">خبر در این زمان به‌صورت خودکار منتشر می‌شود (با فرض اینکه زمان‌بندی سرور فعال باشد).</p>
        </div>
      )}

      {/* Toggles */}
      <div className="flex flex-wrap gap-6 pt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <Switch checked={form.isFeatured} onCheckedChange={(c) => setForm({ ...form, isFeatured: c })} />
          <span className="text-sm">مطلب ویژه</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Switch checked={form.isBreaking} onCheckedChange={(c) => setForm({ ...form, isBreaking: c })} />
          <span className="text-sm">خبر فوری</span>
        </label>
        {form.status !== 'SCHEDULED' && (
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={form.isPublished} onCheckedChange={(c) => setForm({ ...form, isPublished: c })} />
            <span className="text-sm">منتشر شده</span>
          </label>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel}>انصراف</Button>
        <Button type="submit">ذخیره</Button>
      </div>
    </form>
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
