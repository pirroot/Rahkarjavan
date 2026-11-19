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
import { FileUpload } from '@/components/admin/FileUpload'
import { Plus, Pencil, Trash2, Eye, Star, Video as VideoIcon } from 'lucide-react'
import { formatPersianNumber, videoTypeLabels, timeAgo } from '@/lib/utils'
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
import { Badge } from '@/components/ui/badge'

export function AdminVideos() {
  const [videos, setVideos] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/videos').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
    ]).then(([v, c]) => {
      setVideos(v.videos || [])
      setCategories(c.categories || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const handleSave = async (data: any) => {
    try {
      if (editing) {
        const r = await fetch(`/api/admin/videos/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!r.ok) {
          const j = await r.json()
          throw new Error(j.error || 'خطا')
        }
        toast.success('ویدیو به‌روزرسانی شد')
      } else {
        const r = await fetch('/api/admin/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!r.ok) {
          const j = await r.json()
          throw new Error(j.error || 'خطا')
        }
        toast.success('ویدیو با موفقیت ایجاد شد')
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
      const r = await fetch(`/api/admin/videos/${id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error('خطا')
      toast.success('ویدیو حذف شد')
      loadData()
    } catch {
      toast.error('خطا در حذف')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">مدیریت ویدیوها</h1>
          <p className="text-sm text-muted-foreground">مدیریت تمام ویدیوهای رسانه تصویری</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null) }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-1" />
              افزودن ویدیو
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'ویرایش ویدیو' : 'افزودن ویدیوی جدید'}</DialogTitle>
            </DialogHeader>
            <VideoForm
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
      ) : videos.length === 0 ? (
        <div className="text-center py-16">
          <VideoIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">ویدیویی ثبت نشده</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>عنوان</TableHead>
                <TableHead>دسته</TableHead>
                <TableHead>نوع</TableHead>
                <TableHead>بازدید</TableHead>
                <TableHead>ویژه</TableHead>
                <TableHead>تاریخ</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((v, i) => (
                <TableRow key={v.id}>
                  <TableCell className="text-muted-foreground">{formatPersianNumber(i + 1)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-md bg-secondary overflow-hidden shrink-0">
                        <img src={v.coverImage} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="font-medium text-foreground line-clamp-1 max-w-xs">{v.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>{v.category?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{videoTypeLabels[v.videoType]}</Badge>
                  </TableCell>
                  <TableCell>{formatPersianNumber(v.views)}</TableCell>
                  <TableCell>
                    {v.isFeatured ? (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{timeAgo(v.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(v); setOpen(true) }}>
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
                            <AlertDialogTitle>حذف ویدیو</AlertDialogTitle>
                            <AlertDialogDescription>
                              آیا از حذف ویدیو «{v.title}» مطمئن هستید؟ این عمل قابل بازگشت نیست.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>انصراف</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(v.id)}>حذف</AlertDialogAction>
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

function VideoForm({ initial, categories, onSave, onCancel }: {
  initial: any | null
  categories: any[]
  onSave: (data: any) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    titleEn: initial?.titleEn || '',
    slug: initial?.slug || '',
    description: initial?.description || '',
    descriptionEn: initial?.descriptionEn || '',
    coverImage: initial?.coverImage || '',
    videoUrl: initial?.videoUrl || '',
    duration: initial?.duration || '00:00',
    videoType: initial?.videoType || 'NEWS',
    categoryId: initial?.categoryId || '',
    sourceName: initial?.sourceName || '',
    sourceUrl: initial?.sourceUrl || '',
    isFeatured: initial?.isFeatured ?? false,
    isPublished: initial?.isPublished ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('عنوان الزامی است')
      return
    }
    if (!form.videoUrl.trim()) {
      toast.error('لینک ویدیو الزامی است')
      return
    }
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>عنوان (فارسی) *</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>عنوان (انگلیسی)</Label>
          <Input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} dir="ltr" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Slug (URL)</Label>
          <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} dir="ltr" placeholder="auto-generated" />
        </div>
        <div className="space-y-1.5">
          <Label>مدت زمان</Label>
          <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="12:34" dir="ltr" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>توضیحات (فارسی)</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
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
        <Label>آدرس ویدیو *</Label>
        <FileUpload
          value={form.videoUrl}
          onChange={(url) => setForm({ ...form, videoUrl: url })}
          folder="videos"
          accept="video/mp4,video/webm"
          preview="video"
          label=""
          hint="حداکثر ۱۰۰ مگابایت - MP4, WebM"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>نوع ویدیو</Label>
          <Select value={form.videoType} onValueChange={(v) => setForm({ ...form, videoType: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(videoTypeLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>دسته‌بندی</Label>
          <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
            <SelectTrigger><SelectValue placeholder="انتخاب..." /></SelectTrigger>
            <SelectContent>
              {categories.filter((c) => c.type === 'VIDEO' || c.type === 'BOTH').map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>منبع</Label>
          <Input value={form.sourceName} onChange={(e) => setForm({ ...form, sourceName: e.target.value })} />
        </div>
      </div>

      <div className="flex gap-6 pt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <Switch checked={form.isFeatured} onCheckedChange={(c) => setForm({ ...form, isFeatured: c })} />
          <span className="text-sm">ویدیوی ویژه</span>
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
