'use client'

// AboutPage — public About Us page.
// پایگاه خبری راهکار جوان
//
// All text is editable from the admin dashboard (AdminPages → About). When a
// field is empty we fall back to a sensible default so the page never looks
// broken before the admin has filled it in. We deliberately do NOT show a
// team members grid — the client asked us to keep About/Contact minimal and
// professional.

import { useStore } from '@/lib/store'
import { useSettings } from '@/hooks/use-auth'
import { ChevronLeft, Target, Eye, Heart, Users } from 'lucide-react'

export function AboutPage() {
  const { navigate } = useStore()
  const settings = useSettings()

  const aboutText =
    settings.about_text ||
    'پایگاه خبری راهکار جوان، رسانه‌ای مستقل با تمرکز بر اخبار و مسائل جوانان ایران و جهان است.'

  // Each value card pulls its body text from settings, with a default that
  // matches the original copy so the page is never empty.
  const mission = settings.about_mission ||
    'صدای واقعی نسل جوان را به گوش همه برسانیم و رسانه‌ای برای جوانان توسط جوانان باشیم.'
  const vision = settings.about_vision ||
    'تبدیل شدن به معتبرترین رسانه جوانان در منطقه و مرجع اصلی اخبار اجتماعی، فرهنگی.'
  const values = settings.about_values ||
    'صداقت، استقلال، احترام به تنوع و تعهد به حقیقت، اصول بنیادین ماست.'
  const audience = settings.about_audience ||
    'جوانان ۱۵ تا ۳۵ سال و تمام علاقه‌مندان به اخبار اجتماعی، فرهنگی و اقتصادی.'

  // The "story" section is admin-editable multi-paragraph text. Each line
  // becomes its own <p>. When empty we use the original default copy.
  const storyText = settings.about_story || (
    'پایگاه خبری راهکار جوان با هدف پر کردن شکافی بزرگ در رسانه‌های ایران شکل گرفت؛ رسانه‌ای که صدای جوانان باشد و از زاویه دید آن‌ها به جهان نگاه کند.\n' +
    'ما باور داریم که جوانان ایرانی، با تمام پتانسیل، انرژی و خلاقیتشان، سزاوار رسانه‌ای مستقل و حرفه‌ای هستند که دغدغه‌های آن‌ها را بازتاب دهد و فرصت‌های پیش رویشان را روشن کند.\n' +
    'از همان ابتدا، تصمیم گرفتیم رسانه‌ای دوگانه بسازیم: یک بخش رسانه تصویری که ویدیوهای خبری، مصاحبه و گزارش‌های تصویری را در مرکز توجه قرار می‌دهد، و یک مجله خبری که تحلیل‌های عمیق‌تر و گزارش‌های تخصصی ارائه می‌کند.\n' +
    'امروز، با تیمی از جوانان روزنامه‌نگار، فیلم‌ساز و عکاس، در تلاشیم تا داستان‌هایی را روایت کنیم که کمتر شنیده شده‌اند و چهره‌هایی را معرفی کنیم که الهام‌بخش نسل جدید هستند.'
  )
  const storyParagraphs = storyText.split('\n').map((p) => p.trim()).filter(Boolean)

  return (
    <div className="animate-fade-in">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <button onClick={() => navigate('home')} className="hover:text-primary">راهکار جوان</button>
          <ChevronLeft className="h-4 w-4" />
          <span className="text-foreground">درباره ما</span>
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
                <p className="text-sm text-muted-foreground">رسانه تصویری و مجله خبری</p>
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

        {/* Story — admin-editable multi-paragraph text */}
        <section className="bg-card border border-border rounded-2xl p-6 sm:p-10 mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">داستان ما</h2>
          <div className="prose prose-sm sm:prose-base max-w-none text-muted-foreground leading-8 space-y-4">
            {storyParagraphs.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="bg-primary text-primary-foreground rounded-2xl p-6 sm:p-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">با ما در تماس باشید</h2>
          <p className="text-primary-foreground/80 mb-4">
            پیشنهاد، انتقاد یا ایده‌ای دارید؟ خوشحال می‌شویم بشنویم.
          </p>
          <button
            onClick={() => navigate('contact')}
            className="bg-primary-foreground text-primary px-6 py-2 rounded-md font-medium hover:bg-primary-foreground/90 transition-colors"
          >
            تماس با ما
          </button>
        </section>
      </div>
    </div>
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
