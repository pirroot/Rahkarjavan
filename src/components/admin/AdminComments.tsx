'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Trash2, MessageSquare, CheckCircle, XCircle } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
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
import { useStore } from '@/lib/store'

export function AdminComments() {
  const { navigate } = useStore()
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = () => {
    setLoading(true)
    fetch('/api/admin/comments')
      .then((r) => r.json())
      .then((d) => setComments(d.comments || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const handleToggleApproval = async (c: any) => {
    try {
      const r = await fetch(`/api/admin/comments/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: !c.isApproved }),
      })
      if (!r.ok) throw new Error('خطا')
      toast.success(c.isApproved ? 'نظر پنهان شد' : 'نظر تأیید شد')
      loadData()
    } catch {
      toast.error('خطا')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const r = await fetch(`/api/admin/comments/${id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error('خطا')
      toast.success('نظر حذف شد')
      loadData()
    } catch {
      toast.error('خطا')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">مدیریت نظرات</h1>
        <p className="text-sm text-muted-foreground">نظرات کاربران روی مطالب</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">نظری ثبت نشده</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                    {c.authorName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">{c.authorName}</span>
                    <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
                    {c.isApproved ? (
                      <Badge variant="default" className="text-[10px]">تأیید شده</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[10px]">پنهان</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-6 mb-2">{c.content}</p>
                  {c.article && (
                    <button
                      onClick={() => navigate('article', { slug: c.article.slug })}
                      className="text-xs text-primary hover:underline"
                    >
                      روی مطلب: {c.article.title}
                    </button>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleToggleApproval(c)} title={c.isApproved ? 'پنهان کردن' : 'تأیید'}>
                    {c.isApproved ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>حذف نظر</AlertDialogTitle>
                        <AlertDialogDescription>
                          آیا از حذف این نظر مطمئن هستید؟
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>انصراف</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(c.id)}>حذف</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
