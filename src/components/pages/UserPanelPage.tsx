'use client'

import { useEffect, useState, useRef } from 'react'
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
  ImageIcon,
  Check,
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
  const [avatars, setAvatars] = useState<string[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loadingUser && !user) {
      navigate('auth')
    }
  }, [user, loadingUser, navigate])

  // Load the predefined avatar gallery (paths from /avatars/manifest.json).
  // Users cannot upload a custom picture — they must pick one of these.
  useEffect(() => {
    fetch('/api/profile?avatars=1')
      .then((r) => r.json())
      .then((d) => setAvatars(d.avatars || []))
      .catch(() => {})
  }, [])

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

  /** Upload a custom avatar image. Must be ≤ 500 KB. */
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return
    setAvatarError('')
    if (file.size > 500 * 1024) {
      setAvatarError(`حجم تصویر باید کمتر از ۵۰۰ کیلوبایت باشد (حجم فعلی: ${(file.size / 1024).toFixed(0)} کیلوبایت).`)
      toast.error('حجم تصویر زیاد است')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarError('فقط فرمت‌های JPG، PNG و WebP مجاز هستند.')
      toast.error('فرمت تصویر مجاز نیست')
      return
    }
    setUploadingAvatar(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/profile', { method: 'POST', body: fd })
      const json = await r.json()
      if (!r.ok) throw new Error(json.error || 'خطا در آپلود')
      setForm({ ...form, avatar: json.url })
      useStore.setState({
        user: { ...useStore.getState().user!, avatar: json.url },
      })
      toast.success('تصویر پروفایل به‌روزرسانی شد')
    } catch (err: any) {
      setAvatarError(err.message || 'خطا در آپلود')
      toast.error(err.message || 'خطا در آپلود')
    } finally {
      setUploadingAvatar(false)
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
                      {/* Avatar — predefined gallery + custom upload (≤ 500 KB) */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5"><ImageIcon className="h-4 w-4" />انتخاب آواتار</Label>
                        <p className="text-xs text-muted-foreground leading-5">
                          یکی از آواتارهای پیش‌فرض را انتخاب کنید یا تصویر شخصی خود را آپلود کنید (حداکثر ۵۰۰ کیلوبایت).
                        </p>
                        {/* Current avatar preview + upload button */}
                        <div className="flex items-center gap-3 mt-2">
                          <Avatar className="w-16 h-16 border-2 border-border">
                            <AvatarImage src={form.avatar || undefined} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                              {(form.displayName || form.name || 'U').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              ref={fileInputRef}
                              onChange={handleAvatarUpload}
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={uploadingAvatar}
                              onClick={() => fileInputRef.current?.click()}
                            >
                              {uploadingAvatar ? (
                                <>
                                  <span className="ml-2 inline-block h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                  در حال آپلود...
                                </>
                              ) : (
                                <>
                                  <ImageIcon className="h-4 w-4 ml-1" />
                                  آپلود تصویر شخصی
                                </>
                              )}
                            </Button>
                            {form.avatar && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive text-xs h-7 block"
                                onClick={() => setForm({ ...form, avatar: '' })}
                              >
                                حذف آواتار فعلی
                              </Button>
                            )}
                          </div>
                        </div>
                        {avatarError && (
                          <p className="text-xs text-destructive">{avatarError}</p>
                        )}
                        {/* Predefined gallery */}
                        <p className="text-xs text-muted-foreground mt-3">یا از گالری انتخاب کنید:</p>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-1">
                          {avatars.map((av) => {
                            const selected = form.avatar === av
                            return (
                              <button
                                key={av}
                                type="button"
                                onClick={() => setForm({ ...form, avatar: av })}
                                className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-square ${
                                  selected
                                    ? 'border-primary ring-2 ring-primary/30 scale-105'
                                    : 'border-border hover:border-primary/40'
                                }`}
                                title="انتخاب این آواتار"
                              >
                                <img src={av} alt="avatar" className="w-full h-full object-cover" />
                                {selected && (
                                  <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground rounded-full p-0.5">
                                    <Check className="h-3 w-3" />
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
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
