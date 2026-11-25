'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useStore } from '@/lib/store'
import {
  BookOpen,
  Radar,
  Plus,
  Play,
  FlaskConical,
  Settings,
  FileText,
  ChevronLeft,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Clock,
  ImageOff,
  HelpCircle,
  ExternalLink,
} from 'lucide-react'

/**
 * AdminLearning — یک راهنمای خیلی ساده و غیرفنی برای کارفرما.
 *
 * نکات کلیدی این نسخه:
 *  - هر «گام» یک دکمه دارد که مستقیم به همان بخش پنل می‌رود (نه فقط به /admin).
 *    این کار با `navigate('admin', { section: 'aggregator' })` ممکن شده است.
 *  - توضیح «cron» به زبان ساده داده شده (نه با کد).
 *  - مثال‌های واقعی از فارس، تسنیم، ایسنا و مهر داده شده.
 *  - حالت «فقط متن» (که کارفرما خواسته) به‌وضوح توضیح داده شده.
 */

export function AdminLearning() {
  const { navigate } = useStore()

  // Helper: jump to a specific admin section by URL hash deep-link.
  const goTo = (section: string) => navigate('admin', { section })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          راهنمای خودکارسازی خبر (ساده)
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          بدون هیچ دانش فنی، از این قسمت می‌توانید سیستم را طوری تنظیم کنید که
          خودش از سایت‌های خبری دیگر، اخبار را بگیرد و در سایت شما منتشر کند.
        </p>
      </div>

      {/* Intro card — what is this */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground mb-1">خودکارسازی یعنی چه؟</p>
              <p className="text-sm text-muted-foreground leading-6">
                فرض کنید شما می‌خواهید اخبار «سیاسی» از خبرگزاری فارس را در سایتتان
                داشته باشید. به‌جای اینکه هر روز دستی کپی کنید، یک بار آدرس سایت فارس را
                اینجا ثبت می‌کنید و از آن به بعد سیستم خودش هر ۲۰ دقیقه اخبار جدید را
                می‌گیرد و در سایت شما می‌گذارد. این کار قانونی است به شرطی که منبع
                خبر در پایان هر مطلب ذکر شود (که سیستم خودش این کار را می‌کند).
              </p>
              <p className="text-xs text-muted-foreground leading-6 mt-2 bg-muted/40 rounded-md p-2">
                <strong>یادتان باشد:</strong> این سیستم فقط «متن خبر» را وارد می‌کند — نه ویدیو و نه عکس.
                ویدیو را خودتان از پنل «مدیریت ویدیوها» اضافه می‌کنید. عکس اصلی خبر روی سرور
                شما ذخیره نمی‌شود (فضای هاست کم نمی‌شود)؛ سایت فقط همان عکس منبع را نشان می‌دهد
                و اگر نباشد، یک کاور رنگی ساده جای آن می‌نشیند.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step-by-step — each with a deep-link button */}
      <div className="space-y-3">
        <Step
          n={1}
          title="یک منبع خبر اضافه کنید"
          icon={<Radar className="h-5 w-5" />}
          desc="به بخش «منابع خبر» بروید و روی «افزودن منبع» بزنید. ساده‌ترین راه: نام منبع را بنویسید (مثلاً «خبرگزاری فارس — سیاسی») و آدرس RSS یا sitemap آن را در فیلد اول بگذارید. اگر نمی‌دانید آدرس RSS چیست، نمونه‌های آماده پایین همین صفحه را کپی کنید."
          action={
            <Button variant="outline" size="sm" onClick={() => goTo('aggregator')}>
              <Plus className="h-4 w-4 ml-1" />
              رفتن به افزودن منبع
            </Button>
          }
        />
        <Step
          n={2}
          title="منبع را امتحان کنید"
          icon={<Play className="h-5 w-5" />}
          desc="در لیست منابع، کنار هر منبع یک دکمه‌ی «پخش» (مثلث سبز) هست. آن را بزنید تا سیستم یک‌بار منبع را بررسی کند. اگر «وارد: ۳» دیدید یعنی ۳ خبر وارد شده و همه‌چیز درست است. اگر خطا دیدید، آدرس یا سلکتور را اصلاح کنید."
        />
        <Step
          n={3}
          title="منبع را روشن بگذارید"
          icon={<FlaskConical className="h-5 w-5" />}
          desc="منبع به‌صورت پیش‌فرض «فعال» است. وقتی فعال باشد، هر ۲۰ دقیقه (یا بازه‌ای که تنظیم کرده‌اید) سیستم آن را بررسی می‌کند. اگر منبعی زیاد خطا بدهد، خودکار خاموش می‌شود تا به سرور فشار نیاید."
        />
        <Step
          n={4}
          title="حالت «فقط متن» را روشن کنید (مهم)"
          icon={<ImageOff className="h-5 w-5" />}
          desc="کارفرما خواسته که تصاویر خبر‌های اتوماتیک نیایند (به‌خاطر کپی‌رایت). برای این کار، به «تنظیمات تجمیع» بروید و گزینه‌ی «وارد کردن تصاویر» را خاموش کنید. حالا خبر فقط با متن اصلی منبع ذخیره می‌شود: ابتدای متن پیشوند «فارس:» می‌آید و انتهای آن خط «منبع: خبرگزاری فارس — لینک». این کار از نظر کپی‌رایت کاملاً درست است."
          action={
            <Button variant="outline" size="sm" onClick={() => goTo('aggregator-settings')}>
              <Settings className="h-4 w-4 ml-1" />
              رفتن به تنظیمات
              <ChevronLeft className="h-4 w-4" />
            </Button>
          }
        />
        <Step
          n={5}
          title="گزارش‌ها را ببینید"
          icon={<FileText className="h-5 w-5" />}
          desc="در بخش «گزارش‌ها» می‌توانید ببینید هر منبع چند خبر وارد کرده، چند خطا داشته، و وضعیت فعلی‌اش چیست. اگر منبعی مدام خطا بدهد، آن را غیرفعال کنید یا آدرسش را اصلاح کنید."
          action={
            <Button variant="outline" size="sm" onClick={() => goTo('aggregator-logs')}>
              <FileText className="h-4 w-4 ml-1" />
              رفتن به گزارش‌ها
            </Button>
          }
        />
      </div>

      {/* Cron explained simply */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            «کرون» چیست و آیا لازم است؟
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground leading-7">
          <p>
            <strong className="text-foreground">کرون</strong> به زبان ساده یعنی یک
            سرویس که در سرور شما هر چند دقیقه یک بار کاری را انجام می‌دهد. سایت ما
            برای اینکه اخبار جدید را بگیرد، نیاز دارد هر چند دقیقه «بیدار شود».
            این بیدار شدن را یا خود سایت انجام می‌دهد (به‌صورت داخلی)، یا یک «کرون»
            بیرونی آن را صدا می‌زند.
          </p>
          <div className="rounded-md border border-green-500/30 bg-green-500/5 p-3">
            <p className="text-foreground font-medium mb-1">
              ✅ برای اکثر کاربرها لازم نیست کرون تنظیم کنید.
            </p>
            <p className="text-xs leading-6">
              وقتی شما وارد پنل مدیریت می‌شوید یا صفحه‌ی سایت را باز می‌کنید،
              سیستم خودش زمان‌بندی را اجرا می‌کند. این برای یک سایت کوچک کافی است.
            </p>
          </div>
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="text-foreground font-medium mb-1">
              ⚠️ اگر می‌خواهید اخبار حتی وقتی هیچ‌کس سایت را باز نکرده هم‌واره بیاید.
            </p>
            <p className="text-xs leading-6">
              آن وقت باید یک «کرون» روی سرور تنظیم کنید. به ادمین سرور بگویید این
              خط را در فایل <code dir="ltr" className="bg-muted px-1 rounded">crontab</code>{' '}
              اضافه کند (هر دقیقه اجرا می‌شود):
            </p>
            <code dir="ltr" className="block bg-muted p-2 rounded mt-2 text-xs break-all">
              * * * * * curl -s -X POST -H "Authorization: Bearer SECRET" https://yoursite.com/api/cron/crawl
            </code>
            <p className="text-xs mt-2 leading-6">
              مقدار <code dir="ltr" className="bg-muted px-1 rounded">SECRET</code> را
              ادمین سرور در فایل <code dir="ltr" className="bg-muted px-1 rounded">.env</code>{' '}
              با کلید <code dir="ltr" className="bg-muted px-1 rounded">CRON_SECRET</code>{' '}
              قرار می‌دهد. برای دیدن مقدار فعلی، در بخش «تنظیمات تجمیع»، کادر
              «CRON_SECRET» را پر کنید تا رشته‌ی آماده به شما نشان داده شود.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Ready-made source templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            منابع آماده (کپی کنید و در «افزودن منبع» بگذارید)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground leading-6">
            این‌ها آدرس‌های آماده برای چند خبرگزاری پرطرفدار هستند. در پنل «افزودن
            منبع»، فیلد «نام منبع» و «آدرس RSS/Atom» را این‌طور پر کنید. سپس یک
            دسته‌بندی پیش‌فرض (مثلاً «سیاسی») انتخاب کنید و ذخیره بزنید.
          </p>
          <div className="rounded-md border bg-muted/40 p-3 text-xs leading-7 space-y-2">
            <div>
              <strong className="text-foreground">خبرگزاری فارس — سیاسی:</strong>
              <br />
              نام: «خبرگزاری فارس — سیاسی»
              <br />
              آدرس RSS: <code dir="ltr" className="bg-muted px-1 rounded">https://farsnews.ir/sitemaps/contents/2026/11/23/index001.xml</code>
              <br />
              <span className="text-muted-foreground">(آدرس sitemap روزانه است؛ هر روز تاریخ آن عوض می‌شود. برای اینکه هر روز به‌روز باشد، آدرس سالی <code dir="ltr" className="bg-muted px-1 rounded">https://farsnews.ir/sitemaps/contents/index2026.xml</code> را بگذارید — سیستم خودش داخل آن می‌رود و جدیدترین روز را می‌گیرد.)</span>
            </div>
            <div>
              <strong className="text-foreground">خبرگزاری تسنیم:</strong>
              <br />
              آدرس RSS: <code dir="ltr" className="bg-muted px-1 rounded">https://www.tasnimnews.com/fa/rss/feed/0/0/0/</code>
            </div>
            <div>
              <strong className="text-foreground">خبرگزاری ایسنا:</strong>
              <br />
              آدرس RSS: <code dir="ltr" className="bg-muted px-1 rounded">https://www.isna.ir/rss</code>
            </div>
            <div>
              <strong className="text-foreground">خبرگزاری مهر — اقتصاد:</strong>
              <br />
              آدرس لیست: <code dir="ltr" className="bg-muted px-1 rounded">https://www.mehrnews.com/service/Economy</code>
              <br />
              سلکتور لینک: <code dir="ltr" className="bg-muted px-1 rounded">a.news-title, .news-item h3 a</code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" />
            سوال‌های پرتکرار
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground leading-7">
          <Faq q="آیا کپی‌کردن اخبار دیگر سایت‌ها قانونی است؟">
            بله، به‌شرطی که منبع در پایان هر خبر ذکر شود. سیستم ما خودش خط «منبع:
            خبرگزاری فلان — لینک» را اضافه می‌کند. همچنین در حالت «فقط متن»،
            تصاویر کپی نمی‌شوند (که این مورد هم از نظر کپی‌رایت مهم است).
          </Faq>
          <Faq q="چرا بعضی اخبار بدون تصویر می‌آیند؟">
            وقتی گزینه‌ی «وارد کردن تصاویر» در «تنظیمات تجمیع» خاموش است، سیستم
            عمداً تصاویر را وارد نمی‌کند (طبق درخواست کارفرما). خبر فقط متن است و
            ابتدای آن پیشوند منبع (مثلاً «فارس:») می‌آید.
          </Faq>
          <Faq q="خبر تکراری وارد می‌شود؟">
            خیر. سیستم با آدرس و عنوان خبر، تکراری‌ها را تشخیص می‌دهد و آن‌ها را رد
            می‌کند. در گزارش‌ها می‌بینید چند خبر «رد‌شده» بوده.
          </Faq>
          <Faq q="منبعی که اضافه کردم خطا می‌دهد.">
            روی دکمه‌ی «پخش» بزنید و در گزارش‌ها ببینید چه خطایی داده. رایج‌ترین
            دلیل: آدرس اشتباه، یا سایت منبع دسترسی ربات‌ها را بسته. در این حالت
            آدرس sitemap را امتحان کنید (معمولاً جواب می‌دهد).
          </Faq>
          <Faq q="چه دسته‌بندی‌هایی از قبل آماده است؟">
            سیاسی، اقتصادی، ورزشی، نوجوان، فرهنگ و هنر، فناوری، اجتماعی، آموزش،
            خیریه و مصاحبه. در پنل «دسته‌بندی‌ها» می‌توانید دسته‌ی جدید هم بسازید.
          </Faq>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            نکات کوتاه
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground leading-6">
          <p>• برای شروع، ۲ تا ۳ منبع معتبر کافی است. تعداد زیاد، سرعت سیستم را پایین می‌آورد.</p>
          <p>• اگر منبعی پشت paywall یا captcha دارد، احتمالاً کار نمی‌کند.</p>
          <p>• اخبار واردشده به‌صورت پیش‌نویس می‌مانند مگر اینکه «انتشار خودکار» را در منبع روشن کنید.</p>
          <p>• «اعتبار منبع» را همیشه روشن بگذارید تا لینک منبع پای هر خبر نمایش داده شود.</p>
          <p>• برای حذف محتوای نامرتبط (مثل تبلیغات داخل متن خبر) از «قوانین پاکسازی» استفاده کنید.</p>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------- helpers ----------

function Step({
  n,
  title,
  desc,
  icon,
  action,
}: {
  n: number
  title: string
  desc: string
  icon: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
            {n}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {icon}
              <h3 className="font-bold text-foreground">{title}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-6 mb-2">{desc}</p>
            {action}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-medium text-foreground mb-1 flex items-start gap-2">
        <ChevronLeft className="h-4 w-4 text-primary mt-1 shrink-0 rotate-180" />
        {q}
      </p>
      <p className="text-muted-foreground leading-7 pr-6">{children}</p>
    </div>
  )
}
