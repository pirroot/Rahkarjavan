// AdminAggregator.tsx — admin UI for the rule-based news aggregator
// پایگاه خبری راهکار جوان
//
// Sections:
//   sources   — list, add, edit, delete, test, run sources
//   rules     — replace & junk (regex) rules
//   logs      — crawl logs
//   settings  — global aggregator settings

'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { formatPersianNumber, timeAgo, toPersianDigits } from '@/lib/utils'
import {
  Plus, Pencil, Trash2, Play, FlaskConical, RefreshCw, Activity, Loader2,
  AlertCircle, CheckCircle, XCircle, Clock, Radar, Settings as SettingsIcon,
  Eye, ExternalLink, FileText, Filter, Zap, Power, PowerOff,
} from 'lucide-react'
import { SourcesSection } from './aggregator/SourcesSection'
import { RulesSection } from './aggregator/RulesSection'
import { LogsSection } from './aggregator/LogsSection'
import { SettingsSection } from './aggregator/SettingsSection'

interface Category { id: string; name: string }
interface Props { section: 'sources' | 'rules' | 'logs' | 'settings'; categories: Category[] }

export function AdminAggregator({ section, categories }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Radar className="h-6 w-6 text-primary" />
          تجمیع‌کننده‌ی اخبار (کاملاً خودکار، بدون هوش مصنوعی)
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          سیستم کشود منابع خبری، استخراج محتوا، پاکسازی، جایگزینی برند و انتشار اتوماتیک — بدون دخالت کاربر.
        </p>
      </div>

      <StatusBanner />

      {section === 'sources' && <SourcesSection categories={categories} />}
      {section === 'rules' && <RulesSection categories={categories} />}
      {section === 'logs' && <LogsSection />}
      {section === 'settings' && <SettingsSection />}
    </div>
  )
}

// ---------- Status banner ----------

function StatusBanner() {
  const [status, setStatus] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [running, setRunning] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/aggregator/status').then((r) => r.json())
      setStatus(r.status)
      setStats(r.stats)
    } catch {}
  }, [])

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t) }, [load])

  const runAll = async () => {
    setRunning(true)
    try {
      const r = await fetch('/api/admin/aggregator/run', { method: 'POST' }).then((r) => r.json())
      const results = r.results || []
      const total = results.reduce((acc: number, x: any) => acc + x.created, 0)
      toast.success(`اجرای دستی کامل شد — ${toPersianDigits(total)} خبر وارد شد`)
      load()
    } catch {
      toast.error('خطا در اجرا')
    } finally {
      setRunning(false)
    }
  }

  if (!status && !stats) return <Skeleton className="h-32 w-full" />
  return (
    <Card className="border-primary/30">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center gap-3 justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${status?.running ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
            <span className="font-medium">وضعیت زمان‌بندی: {status?.running ? 'فعال' : 'متوقف'}</span>
            {status?.lastRunAt && (
              <span className="text-xs text-muted-foreground">
                • آخرین اجرا: {timeAgo(new Date(status.lastRunAt))}
              </span>
            )}
          </div>
          <Button onClick={runAll} disabled={running} variant="default" size="sm">
            {running ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <Zap className="h-4 w-4 ml-1" />}
            اجرای دستی همه
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox label="منابع فعال" value={stats?.activeSources ?? 0} />
          <StatBox label="خبر وارد‌شده امروز" value={stats?.todayRuns ?? 0} />
          <StatBox label="کل خبرهای اتوماتیک" value={stats?.totalArticles ?? 0} />
          <StatBox label="منابع غیرفعال (خطای زیاد)" value={stats?.disabledSources ?? 0} danger />
        </div>
      </CardContent>
    </Card>
  )
}

function StatBox({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${danger && value > 0 ? 'border-red-500/50 bg-red-500/5' : 'border-border bg-card'}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{formatPersianNumber(value)}</p>
    </div>
  )
}

// Re-export icons used by subsections for convenience
export { Plus, Pencil, Trash2, Play, FlaskConical, RefreshCw, Activity, Loader2,
  AlertCircle, CheckCircle, XCircle, Clock, Eye, ExternalLink, Filter,
  Power, PowerOff, SettingsIcon, Badge, Button, Input, Label, Textarea, Switch,
  Skeleton, Card, CardContent, CardHeader, CardTitle, Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow, Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogTrigger, Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue, AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, Tabs, TabsContent, TabsList, TabsTrigger, toast,
  formatPersianNumber, timeAgo, toPersianDigits }
