'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Mail, Lock, User, ChevronLeft, Chrome, Github, Sparkles, Send } from 'lucide-react'
import { toast } from 'sonner'
import { signIn } from 'next-auth/react'

export function AuthPage() {
  const { navigate, user } = useStore()
  const { loadingUser } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')

  // Login state
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  // Register state
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '' })
  // Magic link
  const [magicEmail, setMagicEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Available providers
  const [providers, setProviders] = useState<{ magicLinkEnabled: boolean; googleEnabled: boolean; githubEnabled: boolean }>({
    magicLinkEnabled: false,
    googleEnabled: false,
    githubEnabled: false,
  })

  useEffect(() => {
    fetch('/api/auth/providers')
      .then((r) => r.json())
      .then((d) => setProviders(d))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!loadingUser && user) {
      navigate('profile')
    }
  }, [user, loadingUser, navigate])

  // Legacy login (still uses our /api/auth/login for backward compat)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json.error || 'خطا')
      useStore.getState().setUser(json.user)
      toast.success('با موفقیت وارد شدید')
      if (json.user.role === 'ADMIN' || json.user.role === 'EDITOR') {
        navigate('admin')
      } else {
        navigate('profile')
      }
    } catch (e: any) {
      toast.error(e.message || 'خطا در ورود')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm),
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json.error || 'خطا')
      useStore.getState().setUser(json.user)
      toast.success('ثبت‌نام با موفقیت انجام شد')
      navigate('profile')
    } catch (e: any) {
      toast.error(e.message || 'خطا در ثبت‌نام')
    } finally {
      setSubmitting(false)
    }
  }

  // OAuth via NextAuth
  const handleOAuth = (provider: 'google' | 'github') => {
    signIn(provider, { callbackUrl: '/#/profile' })
  }

  // Magic Link via NextAuth email provider
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const result = await signIn('resend', {
        email: magicEmail,
        callbackUrl: '/#/profile',
        redirect: false,
      })
      if (result?.error) {
        toast.error('خطا در ارسال لینک جادویی')
      } else {
        toast.success('لینک جادویی به ایمیل شما ارسال شد. صندوق ایمیل خود را بررسی کنید.')
        setMagicEmail('')
      }
    } catch (e: any) {
      toast.error('خطا در ارسال لینک')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <button onClick={() => navigate('home')} className="hover:text-primary">راهکار جوان</button>
          <ChevronLeft className="h-4 w-4" />
          <span className="text-foreground">حساب کاربری</span>
        </div>

        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl brand-gradient flex items-center justify-center text-primary-foreground font-bold text-3xl mx-auto mb-3">
              ر
            </div>
            <h1 className="text-2xl font-bold text-foreground">به راهکار جوان بپیوندید</h1>
            <p className="text-sm text-muted-foreground mt-1">وارد حساب خود شوید یا حساب جدید بسازید</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">ورود</TabsTrigger>
                <TabsTrigger value="register">ثبت‌نام</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">ایمیل</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="email@example.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className="pr-9"
                        dir="ltr"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">رمز عبور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="pr-9"
                        dir="ltr"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? 'در حال ورود...' : 'ورود'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-6">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">نام و نام خانوادگی</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reg-name"
                        type="text"
                        placeholder="نام شما"
                        value={regForm.name}
                        onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                        className="pr-9"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-email">ایمیل</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="email@example.com"
                        value={regForm.email}
                        onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                        className="pr-9"
                        dir="ltr"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-password">رمز عبور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reg-password"
                        type="password"
                        placeholder="حداقل ۶ کاراکتر"
                        value={regForm.password}
                        onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                        className="pr-9"
                        dir="ltr"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* OAuth providers */}
            {(providers.googleEnabled || providers.githubEnabled) && (
              <>
                <div className="relative my-4">
                  <Separator />
                  <span className="absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                    یا ورود با
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {providers.googleEnabled && (
                    <Button variant="outline" onClick={() => handleOAuth('google')} disabled={submitting}>
                      <Chrome className="h-4 w-4 ml-1" />
                      Google
                    </Button>
                  )}
                  {providers.githubEnabled && (
                    <Button variant="outline" onClick={() => handleOAuth('github')} disabled={submitting}>
                      <Github className="h-4 w-4 ml-1" />
                      GitHub
                    </Button>
                  )}
                </div>
              </>
            )}

            {/* Magic Link */}
            {providers.magicLinkEnabled && (
              <>
                <div className="relative my-4">
                  <Separator />
                  <span className="absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                    یا لینک جادویی
                  </span>
                </div>
                <form onSubmit={handleMagicLink} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="magic-email">ایمیل خود را وارد کنید</Label>
                    <div className="relative">
                      <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="magic-email"
                        type="email"
                        placeholder="email@example.com"
                        value={magicEmail}
                        onChange={(e) => setMagicEmail(e.target.value)}
                        className="pr-9"
                        dir="ltr"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      لینک ورود به ایمیل شما ارسال می‌شود. روی آن کلیک کنید تا وارد شوید.
                    </p>
                  </div>
                  <Button type="submit" variant="secondary" disabled={submitting} className="w-full">
                    {submitting ? (
                      'در حال ارسال...'
                    ) : (
                      <>
                        <Send className="h-4 w-4 ml-1" />
                        ارسال لینک جادویی
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}

            {/* Hint about NextAuth availability */}
            {!providers.googleEnabled && !providers.githubEnabled && !providers.magicLinkEnabled && (
              <div className="mt-4 text-center text-xs text-muted-foreground/70">
                برای فعال‌سازی ورود با Google/GitHub و Magic Link،
                <br />
                متغیرهای محیطی مربوطه را تنظیم کنید.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
