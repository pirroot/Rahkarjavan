// LogsSection.tsx — list CrawlLog entries with filter
'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { formatPersianNumber, timeAgo, toPersianDigits } from '@/lib/utils'
import { RefreshCw, Filter, AlertCircle, CheckCircle, XCircle, Clock, ChevronLeft } from 'lucide-react'

interface Source { id: string; name: string }
interface LogEntry {
  id: string
  sourceId: string
  source: { name: string }
  startedAt: string
  finishedAt: string | null
  found: number
  created: number
  published: number
  skipped: number
  failed: number
  status: string
  durationMs: number | null
  errors: { url: string; error: string }[]
}

export function LogsSection() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [sourceFilter, setSourceFilter] = useState('__all__')
  const [statusFilter, setStatusFilter] = useState('__all__')
  const [detail, setDetail] = useState<LogEntry | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (sourceFilter !== '__all__') params.set('sourceId', sourceFilter)
      if (statusFilter !== '__all__') params.set('status', statusFilter)
      const r = await fetch('/api/admin/aggregator/logs?' + params).then((r) => r.json())
      setLogs(r.logs || [])
    } catch { toast.error('خطا در دریافت گزارش‌ها') }
    finally { setLoading(false) }
  }, [sourceFilter, statusFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    fetch('/api/admin/aggregator/sources').then((r) => r.json()).then((d) => setSources(d.sources || []))
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">گزارش اجراها</h2>
        <p className="text-sm text-muted-foreground mt-1">
          هر سطر گزارش یک اجرای منبع است. روی هر سطر بزن تا خطاها را ببینی.
        </p>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">منبع</label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">همه منابع</SelectItem>
                  {sources.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">وضعیت</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">همه</SelectItem>
                  <SelectItem value="OK">موفق</SelectItem>
                  <SelectItem value="FAILED">خطا</SelectItem>
                  <SelectItem value="SKIPPED">ردشده</SelectItem>
                  <SelectItem value="RUNNING">در حال اجرا</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="h-4 w-4 ml-1" /> به‌روزرسانی
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? <Skeleton className="h-64 w-full" /> : logs.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-lg">
          <Filter className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">هیچ گزارشی یافت نشد</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>منبع</TableHead>
                <TableHead>شروع</TableHead>
                <TableHead>مدت</TableHead>
                <TableHead>پیدا</TableHead>
                <TableHead>وارد</TableHead>
                <TableHead>منتشر</TableHead>
                <TableHead>رد</TableHead>
                <TableHead>خطا</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setDetail(l)}>
                  <TableCell className="font-medium">{l.source?.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{timeAgo(new Date(l.startedAt))}</TableCell>
                  <TableCell className="text-xs">{l.durationMs ? toPersianDigits(Math.round(l.durationMs / 100) / 10) + ' ثانیه' : '—'}</TableCell>
                  <TableCell>{formatPersianNumber(l.found)}</TableCell>
                  <TableCell className="font-medium text-green-600">{formatPersianNumber(l.created)}</TableCell>
                  <TableCell>{formatPersianNumber(l.published)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatPersianNumber(l.skipped)}</TableCell>
                  <TableCell className={l.failed > 0 ? 'text-red-600' : ''}>{formatPersianNumber(l.failed)}</TableCell>
                  <TableCell><StatusBadge status={l.status} /></TableCell>
                  <TableCell><ChevronLeft className="h-4 w-4 text-muted-foreground" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>جزئیات اجرا — {detail?.source?.name}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <Stat label="شروع" value={new Date(detail.startedAt).toLocaleString('fa-IR')} />
                <Stat label="مدت" value={detail.durationMs ? toPersianDigits(Math.round(detail.durationMs / 100) / 10) + ' ثانیه' : '—'} />
                <Stat label="وضعیت" value={detail.status} />
                <Stat label="پیدا شده" value={formatPersianNumber(detail.found)} />
                <Stat label="وارد شده" value={formatPersianNumber(detail.created)} />
                <Stat label="منتشر شده" value={formatPersianNumber(detail.published)} />
                <Stat label="رد شده" value={formatPersianNumber(detail.skipped)} />
                <Stat label="ناموفق" value={formatPersianNumber(detail.failed)} />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2">خطاها</h3>
                {detail.errors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">بدون خطا</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {detail.errors.map((e, i) => (
                      <div key={i} className="rounded border p-2 text-xs">
                        <p className="font-mono break-all text-muted-foreground" dir="ltr">{e.url || '(no url)'}</p>
                        <p className="text-red-600 mt-1">{e.error}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded p-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'OK') return <Badge className="bg-green-600 hover:bg-green-600"><CheckCircle className="h-3 w-3 ml-1" /> موفق</Badge>
  if (status === 'FAILED') return <Badge variant="destructive"><XCircle className="h-3 w-3 ml-1" /> خطا</Badge>
  if (status === 'RUNNING') return <Badge variant="secondary"><Clock className="h-3 w-3 ml-1" /> در حال اجرا</Badge>
  return <Badge variant="outline">{status}</Badge>
}
