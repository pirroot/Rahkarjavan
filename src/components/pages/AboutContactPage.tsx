'use client'

// AboutContactPage — combined About Us + Contact Us page
// پایگاه خبری راهکار جوان
//
// The client asked us to merge About and Contact into a single page so
// visitors see who we are and how to reach us in one place. The page is
// reached via both `?page=about` and `?page=contact` — `page` prop tells us
// which section the visitor came for, and we scroll to that section on load.

import { useEffect, useState, useRef } from 'react'
import { useStore } from '@/lib/store'
import { useSettings } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ChevronLeft, Target, Eye, Heart, Users, Mail, Phone, MapPin, Send } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  /** "about" or "contact" — which section to scroll to on load. */
  focus?: 'about' | 'contact'
}

export function AboutContactPage({ focus = 'about' }: Props) {
  const { navigate } = useStore()
  const settings = useSettings()
  const contactRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (focus === 'contact' && contactRef.current) {
      contactRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [focus])

  const aboutText =
    settings.about_text ||
    'پایگاه خبری راهکار جوان، رسانه‌ای مستقل با تمرکز بر اخبار و مسائل جوانان ایران و جهان است.'

  const mission = settings.about_mission ||
    'صدای واقعی نسل جوان را به گوش همه برسانیم و رسانه‌ای برای جوانان توسط جوانان باشیم.'
  const vision = settings.about_vision ||
    'تبدیل شدن به معتبرترین رسانه جوانان در منطقه و مرجع اصلی اخبار اجتماعی، فرهنگی.'
  const values = settings.about_values ||
    'صداقت، استقلال، احترام به تنوع و تعهد به حقیقت، اصول بنیادین ماست.'
  const audience = settings.about_audience ||
    'جوانان ۱۵ تا ۳۵ سال و تمام علاقه‌مندان به اخبار اجتماعی، فرهنگی و اقتصادی.'

  const storyText = settings.about_story || (
    'پایگاه خبری راهکار جوان با هدف پر کردن شکافی بزرگ در رسانه‌های ایران شکل گرفت؛ رسانه‌ای که صدای جوانان باشد و از زاویه دید آن‌ها به جهان نگاه کند.\n' +
    'ما باور داریم که جوانان ایرانی، با تمام پتانسیل، انرژی و خلاقیتشان، سزاوار رسانه‌ای مستقل و حرفه‌ای هستند که دغدغه‌های آن‌ها را بازتاب دهد و فرصت‌های پیش رویشان را روشن کند.\n' +
    'از همان ابتدا، تصمیم گرفتیم رسانه‌ای بنیادین بسازیم که اخبار، تحلیل‌های عمیق و گزارش‌های تخصصی را در مرکز توجه قرار دهد.\n' +
    'امروز، با تیمی از جوانان روزنامه‌نگار و نویسنده، در تلاشیم تا داستان‌هایی را روایت کنیم که کمتر شنیده شده‌اند و چهره‌هایی را معرفی کنیم که الهام‌بخش نسل جدید هستند.'
  )
  const storyParagraphs = storyText.split('\n').map((p) => p.trim()).filter(Boolean)

  return (
    <div className="animate-fade-in">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <button onClick={() => navigate('home')} className="hover:text-primary">راهکار جوان</button>
          <ChevronLeft className="h-4 w-4" />
          <span className="text-foreground">درباره ما و تماس با ما</span>
        </div>

        {/* Hero */}
        <section className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 via-card to-card border border-border p-6 sm:p-12 mb-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-xl brand-gradient flex items-center justify-center text-primary-foreground font-bold text-2xl">
                ر
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {settings.site_name || 'پایگاه خبری راهکار جوان'}
                </h1>
                <p className="text-sm text-muted-foreground">رسانه خبری جوانان</p>
              </div>
            </div>
            <p className="text-base sm:text-lg text-muted-foreground leading-8">{aboutText}</p>
          </div>
        </section>

        {/* Values */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <ValueCard icon={<Target className="h-6 w-6" />} title="مأموریت ما" text={mission} color="bg-red-500" />
          <ValueCard icon={<Eye className="h-6 w-6" />} title="چشم‌انداز" text={vision} color="bg-blue-500" />
          <ValueCard icon={<Heart className="h-6 w-6" />} title="ارزش‌ها" text={values} color="bg-emerald-500" />
          <ValueCard icon={<Users className="h-6 w-6" />} title="جامعه هدف" text={audience} color="bg-purple-500" />
        </section>

        {/* Story */}
        <section className="bg-card border border-border rounded-2xl p-6 sm:p-10 mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">داستان ما</h2>
          <div className="prose prose-sm sm:prose-base max-w-none text-muted-foreground leading-8 space-y-4">
            {storyParagraphs.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        {/* Contact — combined into the same page */}
        <section ref={contactRef} className="scroll-mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">تماس با ما</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  {settings.contact_text || 'پیشنهاد، انتقاد یا همکاری دارید؟ فرم زیر را پر کنید.'}
                </p>
                <ContactForm />
              </div>
            </div>

            {/* Contact info */}
            <aside>
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-bold text-foreground mb-4">اطلاعات تماس</h3>
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
              </div>
            </aside>
          </div>
        </section>
      </div>
    </div>
  )
}

/** Inline contact form so we don't duplicate state logic from ContactPage. */
function ContactForm() {
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
        {submitting ? 'در حال ارسال...' : (<><Send className="h-4 w-4 ml-1" />ارسال پیام</>)}
      </Button>
    </form>
  )
}

function ValueCard({ icon, title, text, color }: { icon: React.ReactNode; title: string; text: string; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className={`${color} w-12 h-12 rounded-lg flex items-center justify-center text-white mb-3`}>
        {icon}
      </div>
      <h3 className="font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-6">{text}</p>
    </div>
  )
}
