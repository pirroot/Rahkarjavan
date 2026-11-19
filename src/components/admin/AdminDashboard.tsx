'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Newspaper, Video, Eye, Mail, MessageSquare, Plus, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useStore } from '@/lib/store'
import { formatPersianNumber, timeAgo, videoTypeLabels } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export function AdminDashboard() {
  const { navigate } = useStore()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!data) {
    return <p className="text-muted-foreground">خطا در بارگذاری اطلاعات</p>
  }

  const { stats, catStats, recentArticles, popularVideos, recentComments } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">داشبورد مدیریت</h1>
          <p className="text-sm text-muted-foreground">نمای کلی از وضعیت سایت</p>
        </div>
        <Button onClick={() => navigate('magazine')}>
          <Plus className="h-4 w-4 ml-1" />
          افزودن خبر
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="کاربران"
          value={stats.users}
          icon={<Users className="h-5 w-5" />}
          color="bg-blue-500"
        />
        <StatCard
          title="اخبار منتشر شده"
          value={stats.articles}
          icon={<Newspaper className="h-5 w-5" />}
          color="bg-emerald-500"
        />
        <StatCard
          title="ویدیوها"
          value={stats.videos}
          icon={<Video className="h-5 w-5" />}
          color="bg-purple-500"
        />
        <StatCard
          title="کل بازدیدها"
          value={stats.totalViews}
          icon={<Eye className="h-5 w-5" />}
          color="bg-orange-500"
        />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            بازدیدها بر اساس دسته‌بندی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catStats} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 10%)" />
                <XAxis type="number" tick={{ fill: 'oklch(0.65 0.005 280)', fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: 'oklch(0.96 0.005 280)', fontSize: 11 }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(0.18 0.008 280)',
                    border: '1px solid oklch(1 0 0 / 10%)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: 'oklch(0.96 0.005 280)' }}
                  formatter={(value: any) => [formatPersianNumber(Number(value)), 'بازدید']}
                />
                <Bar dataKey="views" fill="oklch(0.58 0.22 27)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Latest items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent articles */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">آخرین اخبار</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentArticles?.slice(0, 5).map((a: any) => (
              <div
                key={a.id}
                className="flex items-center gap-3 py-2 border-b border-border last:border-0 cursor-pointer hover:bg-secondary/30 -mx-2 px-2 rounded"
                onClick={() => navigate('article', { slug: a.slug })}
              >
                <div className="w-10 h-10 rounded-md bg-secondary overflow-hidden shrink-0">
                  <img src={a.coverImage} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-1">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(a.createdAt)}</p>
                </div>
                {a.isFeatured && (
                  <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded">ویژه</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Popular videos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">ویدیوهای پربازدید</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {popularVideos?.slice(0, 5).map((v: any) => (
              <div
                key={v.id}
                className="flex items-center gap-3 py-2 border-b border-border last:border-0 cursor-pointer hover:bg-secondary/30 -mx-2 px-2 rounded"
                onClick={() => navigate('video', { slug: v.slug })}
              >
                <div className="w-10 h-10 rounded-md bg-secondary overflow-hidden shrink-0">
                  <img src={v.coverImage} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-1">{v.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {formatPersianNumber(v.views)} بازدید
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent comments + messages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              آخرین نظرات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentComments?.slice(0, 4).map((c: any) => (
              <div key={c.id} className="py-2 border-b border-border last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{c.authorName}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{c.content}</p>
              </div>
            ))}
            {(!recentComments || recentComments.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-6">نظری ثبت نشده</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              پیام‌های دریافتی
              {stats.unreadMessages > 0 && (
                <span className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                  {formatPersianNumber(stats.unreadMessages)} خوانده‌نشده
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              برای مشاهده پیام‌های تماس با ما، به بخش «پیام‌ها» در منوی کناری مراجعه کنید.
            </p>
            <p className="text-sm text-foreground mt-2">
              کل پیام‌های خوانده‌نشده: {formatPersianNumber(stats.unreadMessages)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold text-foreground">{formatPersianNumber(value)}</p>
          </div>
          <div className={`${color} w-10 h-10 rounded-lg flex items-center justify-center text-white`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
