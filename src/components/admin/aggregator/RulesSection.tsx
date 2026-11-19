// RulesSection.tsx — manage replace rules and junk (regex) rules
'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { formatPersianNumber, toPersianDigits } from '@/lib/utils'
import { Plus, Pencil, Trash2, Loader2, FlaskConical } from 'lucide-react'

interface Category { id: string; name: string }
interface Source { id: string; name: string }
interface ReplaceRule {
  id: string; sourceId: string | null; find: string; replaceWith: string
  isRegex: boolean; caseSensitive: boolean; order: number; isActive: boolean
}
interface JunkRule { id: string; sourceId: string | null; pattern: string; isActive: boolean }

export function RulesSection({ categories }: { categories: Category[] }) {
  const [sources, setSources] = useState<Source[]>([])
  useEffect(() => {
    fetch('/api/admin/aggregator/sources').then((r) => r.json()).then((d) => setSources(d.sources || []))
  }, [])
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">قوانین پاکسازی و جایگزینی</h2>
        <p className="text-sm text-muted-foreground mt-1">
          قوانین «جایگزینی برند» عبارت‌های نام منبع را با نام سایت ما عوض می‌کنند. قوانین «حذف خط مزاحم»
          پاراگراف‌هایی که با الگوی regex مطابقت دارند را حذف می‌کنند. قوانینی که بدون منبع باشند سراسری‌اند.
        </p>
      </div>
      <Tabs defaultValue="replace">
        <TabsList>
          <TabsTrigger value="replace">قوانین جایگزینی</TabsTrigger>
          <TabsTrigger value="junk">قوانین حذف خط</TabsTrigger>
          <TabsTrigger value="preview">پیش‌نمایش</TabsTrigger>
        </TabsList>
        <TabsContent value="replace" className="pt-3">
          <ReplaceRulesTab sources={sources} />
        </TabsContent>
        <TabsContent value="junk" className="pt-3">
          <JunkRulesTab sources={sources} />
        </TabsContent>
        <TabsContent value="preview" className="pt-3">
          <PreviewTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ---------- Replace rules ----------

function ReplaceRulesTab({ sources }: { sources: Source[] }) {
  const [rules, setRules] = useState<ReplaceRule[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<ReplaceRule | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/aggregator/replace-rules').then((r) => r.json())
      setRules(r.rules || [])
    } catch { toast.error('خطا') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const del = async (id: string) => {
    await fetch('/api/admin/aggregator/replace-rules?id=' + id, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{formatPersianNumber(rules.length)} قانون</span>
        <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditing(null) }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 ml-1" /> افزودن قانون</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>{editing ? 'ویرایش' : 'قانون جدید'}</DialogTitle></DialogHeader>
            <ReplaceRuleForm
              key={editing?.id || 'new'}
              initial={editing}
              sources={sources}
              onCancel={() => { setEditOpen(false); setEditing(null) }}
              onSaved={() => { setEditOpen(false); setEditing(null); load() }}
            />
          </DialogContent>
        </Dialog>
      </div>
      {loading ? <Skeleton className="h-40 w-full" /> : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>پیدا کن</TableHead>
                <TableHead>جایگزین کن</TableHead>
                <TableHead>منبع</TableHead>
                <TableHead>نوع</TableHead>
                <TableHead>ترتیب</TableHead>
                <TableHead>فعال</TableHead>
                <TableHead className="text-left">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs max-w-40 truncate" dir="ltr">{r.find}</TableCell>
                  <TableCell className="font-mono text-xs max-w-40 truncate" dir="ltr">{r.replaceWith}</TableCell>
                  <TableCell>{r.sourceId ? sources.find((s) => s.id === r.sourceId)?.name : <Badge variant="secondary">سراسری</Badge>}</TableCell>
                  <TableCell>
                    {r.isRegex ? <Badge variant="default">Regex</Badge> : <Badge variant="outline">متن</Badge>}
                    {r.caseSensitive && <span className="text-[10px] text-muted-foreground mr-1">حساس</span>}
                  </TableCell>
                  <TableCell>{formatPersianNumber(r.order)}</TableCell>
                  <TableCell>{r.isActive ? '✓' : '✗'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setEditOpen(true) }}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {rules.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">قانونی ثبت نشده</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function ReplaceRuleForm({ initial, sources, onCancel, onSaved }: {
  initial: ReplaceRule | null; sources: Source[]; onCancel: () => void; onSaved: () => void
}) {
  const [sourceId, setSourceId] = useState(initial?.sourceId || '__global__')
  const [find, setFind] = useState(initial?.find || '')
  const [replaceWith, setReplaceWith] = useState(initial?.replaceWith || '')
  const [isRegex, setIsRegex] = useState(initial?.isRegex ?? false)
  const [caseSensitive, setCaseSensitive] = useState(initial?.caseSensitive ?? false)
  const [order, setOrder] = useState(initial?.order ?? 0)
  const [isActive, setIsActive] = useState(initial?.isActive ?? true)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!find.trim()) { toast.error('متن جستجو الزامی است'); return }
    setSaving(true)
    const body = {
      sourceId: sourceId === '__global__' ? null : sourceId,
      find, replaceWith, isRegex, caseSensitive, order, isActive,
    }
    const url = '/api/admin/aggregator/replace-rules'
    const method = initial ? 'PUT' : 'POST'
    const r = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(initial ? { id: initial.id, ...body } : body),
    })
    setSaving(false)
    if (!r.ok) { toast.error('خطا'); return }
    toast.success(initial ? 'به‌روزرسانی شد' : 'ساخته شد')
    onSaved()
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">منبع (خالی = سراسری)</Label>
        <Select value={sourceId} onValueChange={setSourceId}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__global__">سراسری (همه منابع)</SelectItem>
            {sources.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">پیدا کن</Label>
        <Input value={find} onChange={(e) => setFind(e.target.value)} dir="ltr" placeholder="خبرگزاری ایسنا" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">جایگزین کن</Label>
        <Input value={replaceWith} onChange={(e) => setReplaceWith(e.target.value)} dir="rtl" placeholder="راهکار جوان" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">نوع Regex</Label>
          <Switch checked={isRegex} onCheckedChange={setIsRegex} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">حساس به حروف</Label>
          <Switch checked={caseSensitive} onCheckedChange={setCaseSensitive} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">فعال</Label>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">ترتیب (بزرگ‌تر = اول اعمال می‌شود)</Label>
        <Input type="number" value={order} onChange={(e) => setOrder(+e.target.value)} dir="ltr" />
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>انصراف</Button>
        <Button onClick={submit} disabled={saving || !find.trim()}>
          {saving && <Loader2 className="h-4 w-4 ml-1 animate-spin" />}
          ذخیره
        </Button>
      </DialogFooter>
    </div>
  )
}

// ---------- Junk rules ----------

function JunkRulesTab({ sources }: { sources: Source[] }) {
  const [rules, setRules] = useState<JunkRule[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<JunkRule | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/aggregator/junk-rules').then((r) => r.json())
      setRules(r.rules || [])
    } catch { toast.error('خطا') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const del = async (id: string) => {
    await fetch('/api/admin/aggregator/junk-rules?id=' + id, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{formatPersianNumber(rules.length)} قانون</span>
        <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditing(null) }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 ml-1" /> افزودن الگو</Button></DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>{editing ? 'ویرایش' : 'الگوی حذف خط جدید'}</DialogTitle></DialogHeader>
            <JunkRuleForm
              key={editing?.id || 'new'}
              initial={editing}
              sources={sources}
              onCancel={() => { setEditOpen(false); setEditing(null) }}
              onSaved={() => { setEditOpen(false); setEditing(null); load() }}
            />
          </DialogContent>
        </Dialog>
      </div>
      {loading ? <Skeleton className="h-40 w-full" /> : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الگو (regex)</TableHead>
                <TableHead>منبع</TableHead>
                <TableHead>فعال</TableHead>
                <TableHead className="text-left">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs" dir="ltr">{r.pattern}</TableCell>
                  <TableCell>{r.sourceId ? sources.find((s) => s.id === r.sourceId)?.name : <Badge variant="secondary">سراسری</Badge>}</TableCell>
                  <TableCell>{r.isActive ? '✓' : '✗'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setEditOpen(true) }}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {rules.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">قانونی ثبت نشده</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function JunkRuleForm({ initial, sources, onCancel, onSaved }: {
  initial: JunkRule | null; sources: Source[]; onCancel: () => void; onSaved: () => void
}) {
  const [sourceId, setSourceId] = useState(initial?.sourceId || '__global__')
  const [pattern, setPattern] = useState(initial?.pattern || '')
  const [isActive, setIsActive] = useState(initial?.isActive ?? true)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!pattern.trim()) { toast.error('الگو الزامی است'); return }
    try { new RegExp(pattern) } catch { toast.error('regex نامعتبر'); return }
    setSaving(true)
    const body = { sourceId: sourceId === '__global__' ? null : sourceId, pattern, isActive }
    const r = await fetch('/api/admin/aggregator/junk-rules', {
      method: initial ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(initial ? { id: initial.id, ...body } : body),
    })
    setSaving(false)
    if (!r.ok) { toast.error('خطا'); return }
    toast.success(initial ? 'به‌روزرسانی شد' : 'ساخته شد')
    onSaved()
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">منبع</Label>
        <Select value={sourceId} onValueChange={setSourceId}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__global__">سراسری (همه منابع)</SelectItem>
            {sources.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">الگوی regex</Label>
        <Input value={pattern} onChange={(e) => setPattern(e.target.value)} dir="ltr" placeholder="انتهای پیام" />
        <p className="text-[10px] text-muted-foreground">مثال‌ها: <code dir="ltr" className="text-muted-foreground">انتهای پیام</code>، <code dir="ltr" className="text-muted-foreground">کد خبر: \d+</code>، <code dir="ltr" className="text-muted-foreground">عضو کانال ما شوید</code></p>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">فعال</Label>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>انصراف</Button>
        <Button onClick={submit} disabled={saving || !pattern.trim()}>
          {saving && <Loader2 className="h-4 w-4 ml-1 animate-spin" />}
          ذخیره
        </Button>
      </DialogFooter>
    </div>
  )
}

// ---------- Preview ----------

function PreviewTab() {
  const [text, setText] = useState('به گفته خبرگزاری ایسنا، انتهای پیام / کد خبر: ۱۲۳۴')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [rules, setRules] = useState<ReplaceRule[]>([])

  useEffect(() => {
    fetch('/api/admin/aggregator/replace-rules').then((r) => r.json()).then((d) => setRules(d.rules || []))
  }, [])

  const run = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/aggregator/replace-rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, rules }),
      }).then((r) => r.json())
      setOutput(r.output || '')
    } catch { toast.error('خطا') }
    finally { setLoading(false) }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FlaskConical className="h-4 w-4" /> پیش‌نمایش قوانین جایگزینی</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">متن ورودی</Label>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} dir="rtl" />
        </div>
        <Button onClick={run} disabled={loading} size="sm">
          {loading ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <FlaskConical className="h-4 w-4 ml-1" />}
          اعمال قوانین ({formatPersianNumber(rules.length)} قانون)
        </Button>
        {output && (
          <div className="space-y-1.5">
            <Label className="text-xs">خروجی</Label>
            <div className="p-3 rounded-md border bg-muted text-sm" dir="rtl">{output}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
