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
} from 'lucide-react'

export function AdminLearning() {
  const { navigate } = useStore()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          یادگیری خودکارسازی خبر
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          راهنمای گام‌به‌گام و ساده برای خودکارسازی جمع‌آوری و انتشار اخبار
        </p>
      </div>

      {/* Intro card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground mb-1">خودکارسازی چیست؟</p>
              <p className="text-sm text-muted-foreground leading-6">
                سیستم خودکارسازی به‌طور خودکار از سایت‌های خبری منتخب، اخبار را می‌گیرد، متن و عکس را
                استخراج می‌کند، آن‌ها را پاکسازی و ویرایش برند می‌کند و در سایت شما منتشر می‌کند —
                بدون نیاز به کپی‌پیست دستی. شما فقط منابع را یک‌بار اضافه می‌کنید و سیستم کار می‌کند.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step-by-step guide */}
      <div className="space-y-3">
        <Step
          n={1}
          title="یک منبع خبر اضافه کنید"
          icon={<Radar className="h-5 w-5" />}
          desc="به تب «منابع خبر» بروید و یک سایت خبری جدید اضافه کنید. کافی است نام منبع و آدرس RSS آن سایت را وارد کنید (آدرس RSS معمولاً شبیه https://example.com/feed یا /rss است)."
          action={
            <Button variant="outline" size="sm" onClick={() => navigate('admin')}>
              <Plus className="h-4 w-4 ml-1" />
              افزودن منبع
            </Button>
          }
        />
        <Step
          n={2}
          title="منبع را تست کنید"
          icon={<FlaskConical className="h-5 w-5" />}
          desc="قبل از فعال‌سازی، روی دکمه «تست» کلیک کنید تا مطمئن شوید سیستم می‌تواند اخبار را از آن منبع استخراج کند. اگر خطا دیدید، آدرس RSS یا سلکتورها را اصلاح کنید."
        />
        <Step
          n={3}
          title="منبع را فعال کنید"
          icon={<Play className="h-5 w-5" />}
          desc="با فعال کردن منبع (toggle سبز)، سیستم هر ۲۰ دقیقه (یا به فاصله‌ای که تنظیم کرده‌اید) آن منبع را بررسی می‌کند و اخبار جدید را به‌صورت خودکار وارد می‌کند."
        />
        <Step
          n={4}
          title="قوانین پاکسازی را تنظیم کنید"
          icon={<FileText className="h-5 w-5" />}
          desc="در تب «قوانین پاکسازی» می‌توانید کلمات یا عبارات ناخواسته (مثلاً نام منبع اصلی) را با «راهکار جوان» جایگزین کنید. این کار باعث می‌شود خبر شبیه محتوای اصلی سایت شما باشد."
          action={
            <Button variant="outline" size="sm" onClick={() => navigate('admin')}>
              تنظیم قوانین
              <ChevronLeft className="h-4 w-4" />
            </Button>
          }
        />
        <Step
          n={5}
          title="تنظیمات سراسری را بررسی کنید"
          icon={<Settings className="h-5 w-5" />}
          desc="در تب «تنظیمات تجمیع» می‌توانید تنظیم کنید که اخبار خودکار فوراً منتشر شوند یا پیش‌نویس بمانند (برای بازبینی). همچنین می‌توانید فعال بودن «جدیدترین خبرها» را مدیریت کنید."
        />
        <Step
          n={6}
          title="گزارش‌ها را ببینید"
          icon={<FileText className="h-5 w-5" />}
          desc="در تب «گزارش‌ها» می‌توانید ببینید هر منبع چند خبر وارد کرده، چند خطا داشته، و اخبار کجا ذخیره شده‌اند. اگر منبعی زیاد خطا بدهد، خودکار غیرفعال می‌شود."
        />
      </div>

      {/* Latest-news toggle highlight */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            «جدیدترین خبرها» در صفحه اصلی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-7">
            نوار «آخرین خبرها» در زیر هدر سایت، به‌طور خودکار جدیدترین اخبار منتشر‌شده (چه دست‌ساز چه
            خودکار) را نشان می‌دهد. برای اینکه این نوار پر بماند، کافی است منابع فعال داشته باشید.
            می‌توانید از تنظیمات تجمیع، حالت «فقط آخرین‌ها» را روشن کنید تا سیستم فقط جدیدترین اخبار
            هر منبع را وارد کند (نه کل آرشیو).
          </p>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            نکات مهم
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground leading-6">
          <p>• برای شروع، ۲ تا ۳ منبع معتبر کافی است. تعداد زیاد منابع، سرعت سیستم را پایین می‌آورد.</p>
          <p>• اگر منبعی پشت paywall یا captcha دارد، احتمالاً کار نمی‌کند.</p>
          <p>• اخبار واردشده به‌صورت پیش‌نویس می‌مانند مگر اینکه «انتشار خودکار» را روشن کنید.</p>
          <p>• همیشه «اعتبار منبع» را روشن بگذارید تا لینک منبع اصلی پای هر خبر نمایش داده شود.</p>
          <p>• برای حذف محتوای نامرتبط (مثل تبلیغات داخل متن خبر) از «قوانین پاکسازی» استفاده کنید.</p>
        </CardContent>
      </Card>
    </div>
  )
}

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
