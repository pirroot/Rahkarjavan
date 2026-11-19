'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Database, HardDrive, Cloud, RefreshCw, Upload, Shield, Activity } from 'lucide-react'

export function AdminSystem() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadData = () => {
    setLoading(true)
    fetch('/api/admin/system')
      .then((r) => r.json())
      .then((d) => setStatus(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  if (loading) {
    return <Skeleton className="h-96 w-full" />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">وضعیت سیستم</h1>
          <p className="text-sm text-muted-foreground">بررسی زیرساخت‌های سایت</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="h-4 w-4 ml-1" />
          به‌روزرسانی
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Database */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              پایگاه داده
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="نوع" value={status?.database?.provider || 'sqlite'} />
            <Row label="وضعیت" value={
              <Badge variant={status?.database?.connected ? 'default' : 'destructive'}>
                {status?.database?.connected ? 'متصل' : 'قطع'}
              </Badge>
            } />
            <Row label="آمار" value={
              <div className="text-left space-y-1">
                <div>کاربران: {status?.database?.counts?.users}</div>
                <div>ویدیوها: {status?.database?.counts?.videos}</div>
                <div>اخبار: {status?.database?.counts?.articles}</div>
                <div>نظرات: {status?.database?.counts?.comments}</div>
              </div>
            } />
          </CardContent>
        </Card>

        {/* Storage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {status?.storage?.provider === 's3' ? <Cloud className="h-4 w-4 text-primary" /> : <HardDrive className="h-4 w-4 text-primary" />}
              فضای ذخیره‌سازی
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="پروایدر" value={status?.storage?.provider === 's3' ? 'S3/MinIO' : 'Local'} />
            <Row label="وضعیت" value={
              <Badge variant={status?.storage?.configured ? 'default' : 'secondary'}>
                {status?.storage?.configured ? 'فعال' : 'تنظیم نشده'}
              </Badge>
            } />
            {status?.storage?.bucket && <Row label="Bucket" value={status.storage.bucket} />}
            <Row label="Endpoint" value={status?.storage?.endpoint || '-'} />
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">
                برای فعال‌سازی S3/MinIO، متغیرهای محیطی S3_* را تنظیم کنید.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Auth providers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              احراز هویت
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="NextAuth" value={<Badge variant="default">فعال</Badge>} />
            <Row label="Credentials" value={<Badge variant="default">فعال</Badge>} />
            <Row label="Google OAuth" value={
              <Badge variant={status?.auth?.google ? 'default' : 'secondary'}>
                {status?.auth?.google ? 'فعال' : 'غیرفعال'}
              </Badge>
            } />
            <Row label="GitHub OAuth" value={
              <Badge variant={status?.auth?.github ? 'default' : 'secondary'}>
                {status?.auth?.github ? 'فعال' : 'غیرفعال'}
              </Badge>
            } />
            <Row label="Magic Link" value={
              <Badge variant={status?.auth?.magicLink ? 'default' : 'secondary'}>
                {status?.auth?.magicLink ? 'فعال' : 'غیرفعال'}
              </Badge>
            } />
          </CardContent>
        </Card>

        {/* Rate Limiting */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              محدودیت نرخ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="نظرات" value="۵ در ۱۰ دقیقه" />
            <Row label="ورود" value="۵ در ۱۵ دقیقه" />
            <Row label="ثبت‌نام" value="۳ در ساعت" />
            <Row label="تماس" value="۳ در ساعت" />
            <Row label="API عمومی" value="۱۰۰ در دقیقه" />
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">سیستم ضد اسپم و جلوگیری از brute force</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEO Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">SEO و فنی</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Sitemap" value={
            <a href="/sitemap.xml" target="_blank" className="text-primary hover:underline" dir="ltr">
              /sitemap.xml
            </a>
          } />
          <Row label="Robots.txt" value={
            <a href="/robots.txt" target="_blank" className="text-primary hover:underline" dir="ltr">
              /robots.txt
            </a>
          } />
          <Row label="RSS Feed" value={
            <a href="/api/feed" target="_blank" className="text-primary hover:underline" dir="ltr">
              /api/feed
            </a>
          } />
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium text-foreground text-left" dir="auto">{value}</span>
    </div>
  )
}
