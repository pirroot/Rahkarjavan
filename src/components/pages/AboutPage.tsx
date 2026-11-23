'use client'

import { useStore } from '@/lib/store'
import { useSettings } from '@/hooks/use-auth'
import { ChevronLeft, Target, Eye, Heart, Users } from 'lucide-react'

export function AboutPage() {
  const { navigate } = useStore()
  const settings = useSettings()

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
            <p className="text-base sm:text-lg text-muted-foreground leading-8">
              {settings.about_text || 'پایگاه خبری راهکار جوان، رسانه‌ای مستقل با تمرکز بر اخبار و مسائل جوانان ایران و جهان است.'}
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <ValueCard icon={<Target className="h-6 w-6" />} title="مأموریت ما" text="صدای واقعی نسل جوان را به گوش همه برسانیم و رسانه‌ای برای جوانان توسط جوانان باشیم." color="bg-red-500" />
          <ValueCard icon={<Eye className="h-6 w-6" />} title="چشم‌انداز" text="تبدیل شدن به معتبرترین رسانه جوانان در منطقه و مرجع اصلی اخبار اجتماعی، فرهنگی." color="bg-blue-500" />
          <ValueCard icon={<Heart className="h-6 w-6" />} title="ارزش‌ها" text="صداقت، استقلال، احترام به تنوع و تعهد به حقیقت، اصول بنیادین ماست." color="bg-emerald-500" />
          <ValueCard icon={<Users className="h-6 w-6" />} title="جامعه هدف" text="جوانان ۱۵ تا ۳۵ سال و تمام علاقه‌مندان به اخبار اجتماعی، فرهنگی و اقتصادی." color="bg-purple-500" />
        </section>

        {/* Story */}
        <section className="bg-card border border-border rounded-2xl p-6 sm:p-10 mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">داستان ما</h2>
          <div className="prose prose-sm sm:prose-base max-w-none text-muted-foreground leading-8 space-y-4">
            <p>
              پایگاه خبری راهکار جوان در سال ۱۴۰۴ با هدف پر کردن شکافی بزرگ در رسانه‌های ایران شکل گرفت؛ رسانه‌ای که صدای جوانان باشد و از زاویه دید آن‌ها به جهان نگاه کند.
            </p>
            <p>
              ما باور داریم که جوانان ایرانی، با تمام پتانسیل، انرژی و خلاقیتشان، deserve رسانه‌ای مستقل و حرفه‌ای دارند که دغدغه‌های آن‌ها را بازتاب دهد و فرصت‌های پیش رویشان را روشن کند.
            </p>
            <p>
              از همان ابتدا، تصمیم گرفتیم رسانه‌ای دوگانه بسازیم: یک بخش رسانه تصویری که ویدیوهای خبری، مصاحبه و گزارش‌های تصویری را در مرکز توجه قرار می‌دهد، و یک مجله خبری که تحلیل‌های عمیق‌تر و گزارش‌های تخصصی ارائه می‌کند.
            </p>
            <p>
              امروز، با تیمی از جوانان روزنامه‌نگار، فیلم‌ساز و عکاس، در تلاشیم تا داستان‌هایی را روایت کنیم که کمتر شنیده شده‌اند و چهره‌هایی را معرفی کنیم که الهام‌بخش نسل جدید هستند.
            </p>
          </div>
        </section>

        {/* Team */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">تیم راهکار جوان</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <TeamMember name="راهکار جوان" role="بنیان‌گذار" />
            <TeamMember name="نگار احمدی" role="سردبیر مجله" />
            <TeamMember name="آرش رحیمی" role="سرپرست رسانه تصویری" />
            <TeamMember name="مریم حسینی" role="گزارشگر و مصاحبه‌گر" />
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

function TeamMember({ name, role }: { name: string; role: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/20 mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-primary">
        {name.charAt(0)}
      </div>
      <h4 className="font-medium text-foreground">{name}</h4>
      <p className="text-xs text-muted-foreground mt-1">{role}</p>
    </div>
  )
}
