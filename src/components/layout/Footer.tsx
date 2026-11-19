'use client'

import { useStore } from '@/lib/store'
import { useSettings } from '@/hooks/use-auth'
import { Mail, Phone, MapPin, Twitter, Instagram, Send } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export function Footer() {
  const { navigate } = useStore()
  const settings = useSettings()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('لطفاً ایمیل خود را وارد کنید')
      return
    }
    setSubmitting(true)
    try {
      const r = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json.error || 'خطا')
      toast.success('عضویت شما در خبرنامه ثبت شد')
      setEmail('')
    } catch (e: any) {
      toast.error(e.message || 'خطا')
    } finally {
      setSubmitting(false)
    }
  }

  const siteName = settings.site_name || 'راهکار جوان'
  const logoUrl = settings.logo_url || ''

  return (
    <footer className="mt-auto border-t border-border bg-card">
      {/* Newsletter section */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-right">
              <h3 className="text-xl font-bold text-foreground mb-1">عضویت در خبرنامه</h3>
              <p className="text-sm text-muted-foreground">
                جدیدترین اخبار راهکار جوان را در ایمیل خود دریافت کنید
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex w-full md:w-auto gap-2 max-w-md">
              <Input
                type="email"
                placeholder="ایمیل شما"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background"
                dir="ltr"
              />
              <Button type="submit" disabled={submitting}>
                <Send className="h-4 w-4 ml-1" />
                {submitting ? '...' : 'عضویت'}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="h-10 w-auto max-w-[160px] object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-lg brand-gradient flex items-center justify-center text-primary-foreground font-bold text-lg">
                  ر
                </div>
              )}
              <div>
                <div className="font-bold text-foreground">{siteName}</div>
                <div className="text-xs text-muted-foreground">رسانه تصویری - محله خبری</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-6">
              {settings.about_text || 'رسانه‌ای مستقل با تمرکز بر اخبار و مسائل جوانان ایران و جهان.'}
            </p>
            <div className="flex gap-2 pt-2">
              {settings.social_twitter && (
                <a href={settings.social_twitter} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-md bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                  <Twitter className="h-4 w-4" />
                </a>
              )}
              {settings.social_instagram && (
                <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-md bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {settings.social_telegram && (
                <a href={settings.social_telegram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-md bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                  <Send className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-bold text-foreground mb-3">دسترسی سریع</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('home')} className="text-muted-foreground hover:text-primary transition-colors">رسانه تصویری</button></li>
              <li><button onClick={() => navigate('magazine')} className="text-muted-foreground hover:text-primary transition-colors">مجله خبری</button></li>
              <li><button onClick={() => navigate('about')} className="text-muted-foreground hover:text-primary transition-colors">درباره ما</button></li>
              <li><button onClick={() => navigate('contact')} className="text-muted-foreground hover:text-primary transition-colors">تماس با ما</button></li>
              <li><button onClick={() => navigate('auth')} className="text-muted-foreground hover:text-primary transition-colors">ورود / ثبت‌نام</button></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-bold text-foreground mb-3">دسته‌بندی‌ها</h4>
            <FooterCategories />
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-foreground mb-3">اطلاعات تماس</h4>
            <ul className="space-y-3 text-sm">
              {settings.contact_email && (
                <li className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <a href={`mailto:${settings.contact_email}`} className="text-muted-foreground hover:text-primary transition-colors" dir="ltr">
                    {settings.contact_email}
                  </a>
                </li>
              )}
              {settings.contact_phone && (
                <li className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground" dir="ltr">{settings.contact_phone}</span>
                </li>
              )}
              {settings.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{settings.address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} — تمام حقوق برای {siteName} محفوظ است.</p>
          <div className="flex gap-4">
            <button onClick={() => navigate('legal')} className="hover:text-primary transition-colors">
              حریم خصوصی و قوانین
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterCategories() {
  const { navigate } = useStore()
  const [cats, setCats] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCats(d.categories || []))
      .catch(() => {})
  }, [])

  return (
    <ul className="space-y-2 text-sm">
      {cats.slice(0, 6).map((c) => (
        <li key={c.id}>
          <button
            onClick={() => navigate('category', { slug: c.slug })}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {c.name}
          </button>
        </li>
      ))}
    </ul>
  )
}
