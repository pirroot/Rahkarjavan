'use client'

// AdminNewsletter — manage newsletter subscribers.
// پایگاه خبری راهکار جوان
//
// Features: search, filter by status, export to CSV, toggle subscription
// (unsubscribe / reactivate), hard delete, and live summary stats.

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Mail, Search, Download, Trash2, MailCheck, MailX, Users } from 'lucide-react'
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
import { formatPersianNumber, formatPersianDate } from '@/lib/utils'

interface Subscriber {
  id: string
  email: string
  active: boolean
  createdAt: string
}

export function AdminNewsletter() {
  const [subs, setSubs] = useState<Subscriber[]>([])
  const [summary, setSummary] = useState({ total: 0, active: 0, inactive: 0 })
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all')

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (activeFilter !== 'all') params.set('active', activeFilter)
    fetch(`/api/admin/newsletter?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setSubs(d.subscribers || [])
        setSummary(d.summary || { total: d.subscribers?.length || 0, active: 0, inactive: 0 })
      })
      .catch(() => toast.error('خطا در بارگذاری'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => load(), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, activeFilter])

  const handleToggle = async (id: string, active: boolean) => {
    try {
      const r = await fetch('/api/admin/newsletter', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active }),
      })
      if (!r.ok) throw new Error('خطا')
      toast.success(active ? 'عضویت فعال شد' : 'عضویت غیرفعال شد (لغو اشتراک)')
      setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, active } : s)))
      setSummary((prev) => ({
        ...prev,
        active: prev.active + (active ? 1 : -1),
        inactive: prev.inactive + (active ? -1 : 1),
      }))
    } catch {
      toast.error('خطا در به‌روزرسانی')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const r = await fetch('/api/admin/newsletter', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!r.ok) throw new Error('خطا')
      toast.success('مشترک حذف شد')
      setSubs((prev) => prev.filter((s) => s.id !== id))
      setSummary((prev) => ({ ...prev, total: prev.total - 1 }))
    } catch {
      toast.error('خطا در حذف')
    }
  }

  const exportCsv = () => {
    const params = new URLSearchParams({ export: 'csv' })
    if (q) params.set('q', q)
    if (activeFilter !== 'all') params.set('active', activeFilter)
    // Trigger a download via a temporary link so the browser saves the file.
    const a = document.createElement('a')
    a.href = `/api/admin/newsletter?${params.toString()}`
    a.download = `subscribers-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success('خروجی CSV دانلود شد')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            مدیریت خبرنامه
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            مشاهده، جستجو، خروجی و مدیریت مشترکان خبرنامه
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="h-4 w-4 ml-1" />
          خروجی CSV
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard icon={<Users className="h-5 w-5" />} label="کل مشترکین" value={summary.total} color="text-primary" />
        <StatCard icon={<MailCheck className="h-5 w-5" />} label="فعال" value={summary.active} color="text-green-500" />
        <StatCard icon={<MailX className="h-5 w-5" />} label="غیرفعال" value={summary.inactive} color="text-orange-500" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجو با ایمیل..."
            dir="ltr"
            className="pr-9"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'true', 'false'] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={activeFilter === f ? 'default' : 'outline'}
              onClick={() => setActiveFilter(f)}
            >
              {f === 'all' ? 'همه' : f === 'true' ? 'فعال' : 'غیرفعال'}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : subs.length === 0 ? (
        <div className="text-center py-16">
          <Mail className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">مشترکی یافت نشد</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>ایمیل</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>تاریخ عضویت</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subs.map((s, i) => (
                <TableRow key={s.id}>
                  <TableCell className="text-muted-foreground">{formatPersianNumber(i + 1)}</TableCell>
                  <TableCell className="font-mono text-sm" dir="ltr">{s.email}</TableCell>
                  <TableCell>
                    {s.active ? (
                      <Badge variant="default" className="bg-green-600">فعال</Badge>
                    ) : (
                      <Badge variant="secondary">لغو شده</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatPersianDate(s.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        title={s.active ? 'لغو اشتراک' : 'فعال‌سازی'}
                        onClick={() => handleToggle(s.id, !s.active)}
                      >
                        {s.active ? <MailX className="h-4 w-4" /> : <MailCheck className="h-4 w-4" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف مشترک</AlertDialogTitle>
                            <AlertDialogDescription>
                              آیا از حذف ایمیل «{s.email}» مطمئن هستید؟ این عمل قابل بازگشت نیست.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>انصراف</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(s.id)}>حذف</AlertDialogAction>
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

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`${color}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-foreground">{formatPersianNumber(value)}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
