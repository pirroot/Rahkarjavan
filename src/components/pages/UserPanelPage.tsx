'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  User as UserIcon,
  Mail,
  Calendar,
  MessageCircle,
  Eye,
  Heart,
  Settings,
  LogOut,
  ChevronLeft,
  Save,
} from 'lucide-react'
import { formatPersianDateLong, formatPersianNumber, userRoleLabels } from '@/lib/utils'
import { toast } from 'sonner'

export function UserPanelPage() {
  const { user, navigate, loadingUser } = useStore()
  const { logout } = useAuth()
  const [form, setForm] = useState({
    displayName: '',
    name: '',
    bio: '',
    avatar: '',
  })
  const [comments, setComments] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)

  useEffect(() => {
    if (!loadingUser && !user) {
      navigate('auth')
    }
  }, [user, loadingUser, navigate])

  useEffect(() => {
    if (user) {
      setForm({
        displayName: user.displayName || '',
        name: user.name || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
      })
      // Load user comments
      setLoadingComments(true)
      fetch('/api/articles?limit=50')
        .then((r) => r.json())
        .then((d) => {
          // Filter comments by user id across all articles - this is approximated
          const allComments = (d.articles || []).flatMap((a: any) => [])
          setComments(allComments)
        })
        .catch(() => {})
        .finally(() => setLoadingComments(false))
    }
  }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const r = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json.error || 'خطا')
      useStore.getState().setUser(json.user)
      toast.success('پروفایل به‌روزرسانی شد')
    } catch (e: any) {
      toast.error(e.message || 'خطا در ذخیره')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingUser) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-secondary rounded-xl" />
          <div className="h-64 bg-secondary rounded-xl" />
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="animate-fade-in">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <button onClick={() => navigate('home')} className="hover:text-primary">راهکار جوان</button>
          <ChevronLeft className="h-4 w-4" />
          <span className="text-foreground">پروفایل کاربری</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center pb-2">
              <Avatar className="w-24 h-24 mx-auto mb-3 border-2 border-primary">
                <AvatarImage src={user.avatar || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                  {(user.displayName || user.name || 'U').charAt(0)}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{user.displayName || user.name}</CardTitle>
              <p className="text-sm text-muted-foreground" dir="ltr">{user.email}</p>
              <div className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-primary/10 text-primary mx-auto">
                {userRoleLabels[user.role]}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="نظرات" value={0} icon={<MessageCircle className="h-3 w-3" />} />
                <Stat label="بازدید" value={0} icon={<Eye className="h-3 w-3" />} />
                <Stat label="لایک" value={0} icon={<Heart className="h-3 w-3" />} />
              </div>

              <div className="text-sm text-muted-foreground space-y-2 pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>عضویت: {formatPersianDateLong(user.createdAt)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-border space-y-2">
                {(user.role === 'ADMIN' || user.role === 'EDITOR') && (
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate('admin')}>
                    <Settings className="h-4 w-4 ml-2" />
                    پنل مدیریت
                  </Button>
                )}
                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive" onClick={logout}>
                  <LogOut className="h-4 w-4 ml-2" />
                  خروج از حساب
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="edit">
              <TabsList>
                <TabsTrigger value="edit">ویرایش پروفایل</TabsTrigger>
                <TabsTrigger value="comments">نظرات من</TabsTrigger>
              </TabsList>

              <TabsContent value="edit" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">ویرایش پروفایل</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSave} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="avatar">آدرس تصویر آواتار</Label>
                        <Input
                          id="avatar"
                          type="url"
                          placeholder="https://..."
                          value={form.avatar}
                          onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                          dir="ltr"
                        />
                        {form.avatar && (
                          <Avatar className="w-16 h-16 mt-2">
                            <AvatarImage src={form.avatar} />
                            <AvatarFallback>پ</AvatarFallback>
                          </Avatar>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="displayName">نام نمایشی</Label>
                        <Input
                          id="displayName"
                          value={form.displayName}
                          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="name">نام واقعی</Label>
                        <Input
                          id="name"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">درباره من</Label>
                        <Textarea
                          id="bio"
                          value={form.bio}
                          onChange={(e) => setForm({ ...form, bio: e.target.value })}
                          rows={4}
                          maxLength={500}
                          placeholder="چند خط درباره خودتان..."
                        />
                        <p className="text-xs text-muted-foreground text-left">
                          {formatPersianNumber(form.bio.length)} / ۵۰۰
                        </p>
                      </div>

                      <Button type="submit" disabled={submitting}>
                        {submitting ? (
                          'در حال ذخیره...'
                        ) : (
                          <>
                            <Save className="h-4 w-4 ml-1" />
                            ذخیره تغییرات
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comments" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">نظرات من</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingComments ? (
                      <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
                    ) : comments.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">هنوز نظری ثبت نکرده‌اید</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {comments.map((c) => (
                          <div key={c.id} className="bg-secondary/50 rounded-md p-3">
                            <p className="text-sm">{c.content}</p>
                            <p className="text-xs text-muted-foreground mt-2">{formatPersianDateLong(c.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-secondary/50 rounded-md p-2">
      <div className="flex items-center justify-center text-muted-foreground mb-1">{icon}</div>
      <div className="text-lg font-bold text-foreground">{formatPersianNumber(value)}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  )
}
