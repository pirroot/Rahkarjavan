'use client'

import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * LanguageSwitcher — a small flag toggle that flips the site between Persian
 * (default, RTL) and English (LTR). Persists the choice in localStorage and
 * swaps the document dir/lang attributes so the whole layout flips.
 *
 * The client asked: "اون بالا زبان رو مشخص کنیم یا پرچم کشور انگلیس و پرچم ایران
 * مثلاً. وقتی که می‌زنه پرچم انگلیس رو، خود سایت رو ترنسلیت بکنه."
 *
 * UI translation strings come from src/lib/i18n.ts. Article-content
 * translation is handled separately by the "ترجمه به انگلیسی" button on
 * each article page.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useStore()

  const toggle = () => setLang(lang === 'fa' ? 'en' : 'fa')

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className={cn('px-2 gap-1.5', className)}
      title={lang === 'fa' ? 'Switch to English' : 'تغییر به فارسی'}
      aria-label="Toggle language"
    >
      {/* Two flag chips side-by-side; the active one is highlighted */}
      <span
        className={cn(
          'inline-flex items-center justify-center w-6 h-4 rounded text-[10px] font-bold transition-all',
          lang === 'fa' ? 'bg-primary text-primary-foreground ring-2 ring-primary/40' : 'bg-muted text-muted-foreground',
        )}
        aria-hidden={lang !== 'fa'}
      >
        {/* Iran flag colors — green/white/red stacked; we use a simple IR glyph */}
        🇮🇷
      </span>
      <span
        className={cn(
          'inline-flex items-center justify-center w-6 h-4 rounded text-[10px] font-bold transition-all',
          lang === 'en' ? 'bg-primary text-primary-foreground ring-2 ring-primary/40' : 'bg-muted text-muted-foreground',
        )}
        aria-hidden={lang !== 'en'}
      >
        🇬🇧
      </span>
    </Button>
  )
}
