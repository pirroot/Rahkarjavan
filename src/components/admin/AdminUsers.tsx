'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Pencil, Trash2, Users } from 'lucide-react'
import { formatPersianNumber, userRoleLabels, formatPersianDateLong } from '@/lib/utils'
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

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any | null>(null)
  const [open, setOpen] = useState(false)

  const loadData = () => {
    setLoading(true)
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const handleSave = async (data: any) => {
    try {
      const r = await fetch(`/api/admin/users/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!r.ok) {
        const j = await r.json()
        throw new Error(j.error || 'خطا')
      }
      toast.success('کاربر به‌روزرسانی شد')
      setOpen(false)
      setEditing(null)
      loadData()
    } catch (e: any) {
      toast.error(e.message || 'خطا')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const r = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      if (!r.ok) {
        const j = await r.json()
        throw new Error(j.error || 'خطا')
      }
      toast.success('کاربر حذف شد')
      loadData()
    } catch (e: any) {
      toast.error(e.message || 'خطا')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">مدیریت کاربران</h1>
        <p className="text-sm text-muted-foreground">مدیریت کاربران و نقش‌ها</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">کاربری ثبت نشده</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>کاربر</TableHead>
                <TableHead>ایمیل</TableHead>
                <TableHead>نقش</TableHead>
                <TableHead>مطالب</TableHead>
                <TableHead>نظرات</TableHead>
                <TableHead>عضویت</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {(u.displayName || u.name || 'U').charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{u.displayName || u.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground" dir="ltr">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'ADMIN' ? 'default' : u.role === 'EDITOR' ? 'secondary' : 'outline'}>
                      {userRoleLabels[u.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatPersianNumber(u._count?.articles || 0)}</TableCell>
                  <TableCell>{formatPersianNumber(u._count?.comments || 0)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatPersianDateLong(u.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(u); setOpen(true) }}>
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
                            <AlertDialogTitle>حذف کاربر</AlertDialogTitle>
                            <AlertDialogDescription>
                              آیا از حذف کاربر «{u.displayName || u.name}» مطمئن هستید؟
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>انصراف</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(u.id)}>حذف</AlertDialogAction>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ویرایش کاربر</DialogTitle>
          </DialogHeader>
          {editing && (
            <UserEditForm user={editing} onSave={handleSave} onCancel={() => { setOpen(false); setEditing(null) }} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function UserEditForm({ user, onSave, onCancel }: { user: any; onSave: (data: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    displayName: user.displayName || '',
    name: user.name || '',
    bio: user.bio || '',
    role: user.role,
  })

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">نام نمایشی</label>
        <input
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">نام واقعی</label>
        <input
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">بیوگرافی</label>
        <textarea
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          rows={3}
          value={form.bio || ''}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">نقش</label>
        <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(userRoleLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <Button variant="outline" onClick={onCancel}>انصراف</Button>
        <Button onClick={() => onSave(form)}>ذخیره</Button>
      </div>
    </div>
  )
}
