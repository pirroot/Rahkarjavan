'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, FolderTree } from 'lucide-react'
import { categoryTypeLabels } from '@/lib/utils'
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

export function AdminCategories() {
  const [cats, setCats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)

  const loadData = () => {
    setLoading(true)
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((d) => setCats(d.categories || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const handleSave = async (data: any) => {
    try {
      if (editing) {
        const r = await fetch(`/api/admin/categories/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!r.ok) {
          const j = await r.json()
          throw new Error(j.error || 'خطا')
        }
        toast.success('دسته‌بندی به‌روزرسانی شد')
      } else {
        const r = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!r.ok) {
          const j = await r.json()
          throw new Error(j.error || 'خطا')
        }
        toast.success('دسته‌بندی ایجاد شد')
      }
      setOpen(false)
      setEditing(null)
      loadData()
    } catch (e: any) {
      toast.error(e.message || 'خطا')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const r = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
      if (!r.ok) {
        const j = await r.json()
        throw new Error(j.error || 'خطا')
      }
      toast.success('دسته‌بندی حذف شد')
      loadData()
    } catch (e: any) {
      toast.error(e.message || 'خطا در حذف')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">مدیریت دسته‌بندی‌ها</h1>
          <p className="text-sm text-muted-foreground">دسته‌بندی ویدیوها و مطالب</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null) }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-1" />
              افزودن دسته
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'ویرایش دسته' : 'افزودن دسته جدید'}</DialogTitle>
            </DialogHeader>
            <CategoryForm
              initial={editing}
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
      ) : cats.length === 0 ? (
        <div className="text-center py-16">
          <FolderTree className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">دسته‌ای ثبت نشده</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">رنگ</TableHead>
                <TableHead>نام</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>نوع</TableHead>
                <TableHead>ویدیوها</TableHead>
                <TableHead>مطالب</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cats.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="w-6 h-6 rounded-md" style={{ backgroundColor: c.color }} />
                  </TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground" dir="ltr">{c.slug}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{categoryTypeLabels[c.type]}</Badge>
                  </TableCell>
                  <TableCell>{c._count?.videos || 0}</TableCell>
                  <TableCell>{c._count?.articles || 0}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(c); setOpen(true) }}>
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
                            <AlertDialogTitle>حذف دسته</AlertDialogTitle>
                            <AlertDialogDescription>
                              آیا از حذف دسته «{c.name}» مطمئن هستید؟
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>انصراف</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(c.id)}>حذف</AlertDialogAction>
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

function CategoryForm({ initial, onSave, onCancel }: {
  initial: any | null
  onSave: (data: any) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    nameEn: initial?.nameEn || '',
    slug: initial?.slug || '',
    description: initial?.description || '',
    type: initial?.type || 'BOTH',
    color: initial?.color || '#dc2626',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('نام الزامی است')
      return
    }
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>نام (فارسی) *</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>نام (انگلیسی)</Label>
          <Input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} dir="ltr" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Slug</Label>
          <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} dir="ltr" placeholder="auto" />
        </div>
        <div className="space-y-1.5">
          <Label>نوع</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(categoryTypeLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>توضیحات</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
      </div>

      <div className="space-y-1.5">
        <Label>رنگ</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="w-12 h-9 rounded border border-border cursor-pointer"
          />
          <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} dir="ltr" className="max-w-32" />
          <div className="w-9 h-9 rounded-md" style={{ backgroundColor: form.color }} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel}>انصراف</Button>
        <Button type="submit">ذخیره</Button>
      </div>
    </form>
  )
}
