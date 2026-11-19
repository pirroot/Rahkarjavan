'use client'

import { useEffect, useState } from 'react'
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
import { Plus, Pencil, Trash2, Star, Eye, Newspaper, AlertCircle, Sparkles, ExternalLink } from 'lucide-react'
import { formatPersianNumber, articleStatusLabels, timeAgo } from '@/lib/utils'
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'ویرایش مطلب' : 'افزودن مطلب جدید'}</DialogTitle>
            </DialogHeader>
            <ArticleForm
              initial={editing}
              categories={categories}
              onSave={handleSave}
              onCancel={() => { setOpen(false); setEditing(null) }}
            />
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
  const [form, setForm] = useState({
    title: initial?.title || '',
    titleEn: initial?.titleEn || '',
    slug: initial?.slug || '',
    excerpt: initial?.excerpt || '',
    content: initial?.content || '',
    coverImage: initial?.coverImage || '',
    categoryId: initial?.categoryId || '',
    tags: initial?.tags || '',
    isFeatured: initial?.isFeatured ?? false,
    isPublished: initial?.isPublished ?? true,
    isBreaking: initial?.isBreaking ?? false,
    status: initial?.status || 'PUBLISHED',
  })

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
    if (!form.content.trim()) {
      toast.error('محتوا الزامی است')
      return
    }
    onSave(form)
  }

  const insertTag = (tag: string, wrap: string = '') => {
    const textarea = document.getElementById('content-textarea') as HTMLTextAreaElement
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = form.content.substring(start, end)
    let insert: string
    if (wrap) {
      insert = `<${wrap}>${selected || tag}</${wrap}>`
    } else {
      insert = tag
    }
    const newContent = form.content.substring(0, start) + insert + form.content.substring(end)
    setForm({ ...form, content: newContent })
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + insert.length, start + insert.length)
    }, 0)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>عنوان *</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>Slug (URL)</Label>
          <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} dir="ltr" placeholder="auto-generated" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>خلاصه *</Label>
        <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} required />
      </div>

      <div className="space-y-1.5">
        <Label>آدرس تصویر کاور</Label>
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
        <div className="flex items-center justify-between">
          <Label>محتوا (HTML)</Label>
          <div className="flex gap-1 text-xs">
            <Button type="button" size="sm" variant="outline" onClick={() => insertTag('عنوان', 'h2')}>H2</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => insertTag('متن', 'p')}>P</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => insertTag('متن', 'strong')}>B</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => insertTag('متن', 'em')}>I</Button>
          </div>
        </div>
        <Textarea
          id="content-textarea"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          rows={10}
          dir="ltr"
          className="font-mono text-xs"
          required
        />
        <p className="text-xs text-muted-foreground">از تگ‌های HTML مانند &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt; استفاده کنید.</p>
      </div>

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

      <div className="flex flex-wrap gap-6 pt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <Switch checked={form.isFeatured} onCheckedChange={(c) => setForm({ ...form, isFeatured: c })} />
          <span className="text-sm">مطلب ویژه</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Switch checked={form.isBreaking} onCheckedChange={(c) => setForm({ ...form, isBreaking: c })} />
          <span className="text-sm">خبر فوری</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Switch checked={form.isPublished} onCheckedChange={(c) => setForm({ ...form, isPublished: c })} />
          <span className="text-sm">منتشر شده</span>
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel}>انصراف</Button>
        <Button type="submit">ذخیره</Button>
      </div>
    </form>
  )
}
