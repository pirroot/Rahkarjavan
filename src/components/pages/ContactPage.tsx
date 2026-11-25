'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { useSettings } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ChevronLeft, Mail, Phone, MapPin, Send } from 'lucide-react'
import { toast } from 'sonner'

export function ContactPage() {
  const { navigate } = useStore()
  const settings = useSettings()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json.error || 'خطا')
      toast.success('پیام شما با موفقیت ارسال شد. به‌زودی پاسخ می‌دهیم.')
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch (e: any) {
      toast.error(e.message || 'خطا در ارسال پیام')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <button onClick={() => navigate('home')} className="hover:text-primary">راهکار جوان</button>
          <ChevronLeft className="h-4 w-4" />
          <span className="text-foreground">تماس با ما</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">تماس با ما</h1>
              <p className="text-muted-foreground text-sm mb-6">
                {settings.contact_text || 'پیشنهاد، انتقاد یا همکاری دارید؟ فرم زیر را پر کنید.'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">نام و نام خانوادگی *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="نام شما"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">ایمیل *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="email@example.com"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">موضوع *</Label>
                  <Input
                    id="subject"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="موضوع پیام"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">پیام *</Label>
                  <Textarea
                    id="message"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="پیام خود را اینجا بنویسید..."
                    rows={6}
                    required
                  />
                </div>

                <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                  {submitting ? (
                    'در حال ارسال...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 ml-1" />
                      ارسال پیام
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Contact info */}
          <aside>
            <div className="bg-card border border-border rounded-2xl p-6 sticky top-20">
              <h2 className="font-bold text-foreground mb-4">اطلاعات تماس</h2>
              <ul className="space-y-4">
                {settings.contact_email && (
                  <li className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">ایمیل</div>
                      <a href={`mailto:${settings.contact_email}`} className="text-sm text-foreground hover:text-primary" dir="ltr">
                        {settings.contact_email}
                      </a>
                    </div>
                  </li>
                )}
                {settings.contact_phone && (
                  <li className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">تلفن</div>
                      <span className="text-sm text-foreground" dir="ltr">{settings.contact_phone}</span>
                    </div>
                  </li>
                )}
                {settings.contact_address && (
                  <li className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">نشانی</div>
                      <p className="text-sm text-foreground leading-6">{settings.contact_address}</p>
                    </div>
                  </li>
                )}
                {settings.contact_hours && (
                  <li className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">ساعات کاری</div>
                      <p className="text-sm text-foreground leading-6">{settings.contact_hours}</p>
                    </div>
                  </li>
                )}
              </ul>

              <div className="mt-6 pt-6 border-t border-border">
                <div className="text-xs text-muted-foreground mb-2">شبکه‌های اجتماعی</div>
                <div className="flex gap-2">
                  {settings.social_twitter && (
                    <a href={settings.social_twitter} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-md bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                      <Send className="h-4 w-4" />
                    </a>
                  )}
                  {settings.social_instagram && (
                    <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-md bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                      <Mail className="h-4 w-4" />
                    </a>
                  )}
                  {settings.social_telegram && (
                    <a href={settings.social_telegram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-md bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                      <Send className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
