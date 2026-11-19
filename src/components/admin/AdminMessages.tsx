'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Mail, Trash2, CheckCircle, MailOpen } from 'lucide-react'
import { formatPersianDateLong } from '@/lib/utils'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function AdminMessages() {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any | null>(null)

  const loadData = () => {
    setLoading(true)
    fetch('/api/admin/messages')
      .then((r) => r.json())
      .then((d) => setMessages(d.messages || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const handleMarkRead = async (m: any, read: boolean) => {
    try {
      const r = await fetch(`/api/admin/messages/${m.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: read }),
      })
      if (!r.ok) throw new Error('خطا')
      loadData()
      if (selected?.id === m.id) setSelected({ ...m, isRead: read })
    } catch {
      toast.error('خطا')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const r = await fetch(`/api/admin/messages/${id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error('خطا')
      toast.success('پیام حذف شد')
      if (selected?.id === id) setSelected(null)
      loadData()
    } catch {
      toast.error('خطا')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">پیام‌های تماس با ما</h1>
        <p className="text-sm text-muted-foreground">پیام‌های ارسالی از فرم تماس</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16">
          <Mail className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">پیامی دریافت نشده</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`bg-card border rounded-xl p-4 cursor-pointer hover:border-primary/40 transition-colors ${m.isRead ? 'border-border' : 'border-primary/40 bg-primary/5'}`}
              onClick={() => {
                setSelected(m)
                if (!m.isRead) handleMarkRead(m, true)
              }}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${m.isRead ? 'bg-secondary text-muted-foreground' : 'bg-primary text-primary-foreground'}`}>
                  {m.isRead ? <MailOpen className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">{m.name}</span>
                    {!m.isRead && <Badge variant="default" className="text-[10px]">جدید</Badge>}
                    <span className="text-xs text-muted-foreground mr-auto">{formatPersianDateLong(m.createdAt)}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">{m.subject}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{m.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.subject}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-muted-foreground">از:</p>
                  <p className="font-medium text-foreground">{selected.name}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">{selected.email}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatPersianDateLong(selected.createdAt)}
                </div>
              </div>
              <div className="bg-secondary/50 rounded-md p-3">
                <p className="text-sm text-foreground leading-6">{selected.message}</p>
              </div>
              <div className="flex justify-between pt-4 border-t border-border">
                <a href={`mailto:${selected.email}`} className="text-sm text-primary hover:underline">
                  پاسخ از طریق ایمیل
                </a>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4 ml-1" />
                      حذف
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>حذف پیام</AlertDialogTitle>
                      <AlertDialogDescription>آیا از حذف این پیام مطمئن هستید؟</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>انصراف</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(selected.id)}>حذف</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
