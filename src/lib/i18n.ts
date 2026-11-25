'use client'

// Simple i18n dictionary for the site UI (fa / en).
// ببین: ما فقط ترجمه‌های رابط کاربری (UI) را اینجا داریم. ترجمه‌ی خودِ خبر‌ها
// جدا از سمت سرور انجام می‌شود (با دکمه‌ی «ترجمه به انگلیسی» در صفحه‌ی خبر)
// و در ستون‌های titleEn/excerptEn/contentEn ذخیره می‌شود.

import { useStore } from '@/lib/store'

type Dict = Record<string, { fa: string; en: string }>

const DICT: Dict = {
  // Header / nav
  'nav.home': { fa: 'رسانه تصویری', en: 'Visual Media' },
  'nav.magazine': { fa: 'مجله خبری', en: 'News Magazine' },
  'nav.about': { fa: 'درباره ما', en: 'About' },
  'nav.contact': { fa: 'تماس با ما', en: 'Contact' },
  'nav.profile': { fa: 'پنل کاربری', en: 'My Account' },
  'nav.admin': { fa: 'پنل مدیریت', en: 'Admin Panel' },
  'nav.logout': { fa: 'خروج', en: 'Logout' },
  'nav.login': { fa: 'ورود / ثبت‌نام', en: 'Login / Register' },
  'nav.menu': { fa: 'منوی راهکار جوان', en: 'Rahkar Javan Menu' },
  'search.placeholder': { fa: 'جستجوی خبر...', en: 'Search news...' },
  'ticker.label': { fa: 'آخرین خبرها', en: 'Latest News' },
  'slogan': { fa: 'رسانه تصویری - محله خبری', en: 'Visual Media — Neighborhood News' },

  // Homepage sections
  'home.latest': { fa: 'آخرین اخبار', en: 'Latest News' },
  'home.latest.hint': { fa: 'اسکرول کنید تا اخبار بیشتر بارگذاری شوند', en: 'Scroll to load more news' },
  'home.latestVideos': { fa: 'آخرین ویدیوها', en: 'Latest Videos' },
  'home.featured': { fa: 'خبر ویژه', en: 'Featured' },
  'home.videoFeatured': { fa: 'ویدیو ویژه', en: 'Featured Video' },
  'home.selected': { fa: 'اخبار منتخب', en: 'Selected News' },
  'home.selectedVideos': { fa: 'ویدیوهای منتخب', en: 'Selected Videos' },
  'home.allFeatured': { fa: 'مشاهده همه اخبار ویژه', en: 'View all featured news' },
  'home.allFeaturedVideos': { fa: 'مشاهده همه ویدیوهای ویژه', en: 'View all featured videos' },
  'home.noNews': { fa: 'هنوز خبری منتشر نشده است.', en: 'No news published yet.' },
  'home.noVideos': { fa: 'هنوز ویدیویی منتشر نشده است.', en: 'No videos published yet.' },
  'home.endOfNews': { fa: 'به انتهای اخبار رسیدید', en: 'You have reached the end of the news' },
  'home.endOfVideos': { fa: 'به انتهای ویدیوها رسیدید', en: 'You have reached the end of the videos' },
  'home.loading': { fa: 'در حال بارگذاری...', en: 'Loading...' },

  // Article detail
  'article.breaking': { fa: 'فوری', en: 'Breaking' },
  'article.share': { fa: 'اشتراک‌گذاری', en: 'Share' },
  'article.views': { fa: 'بازدید', en: 'views' },
  'article.source': { fa: 'منبع خبر', en: 'News Source' },
  'article.viewAtSource': { fa: 'مشاهده خبر در سایت منبع', en: 'View at source site' },
  'article.related': { fa: 'مطالب مرتبط', en: 'Related Articles' },
  'article.more': { fa: 'مطالب بیشتر', en: 'More Articles' },
  'article.noRelated': { fa: 'مطلب مرتبطی یافت نشد', en: 'No related articles found' },
  'article.translate': { fa: 'ترجمه به انگلیسی', en: 'Translate to English' },
  'article.translate.done': { fa: 'ترجمه شد', en: 'Translated' },
  'article.translate.loading': { fa: 'در حال ترجمه...', en: 'Translating...' },
  'article.translate.error': { fa: 'خطا در ترجمه', en: 'Translation failed' },
  'article.translate.viewEn': { fa: 'نسخه انگلیسی', en: 'English version' },
  'article.translate.viewFa': { fa: 'نسخه فارسی', en: 'Persian version' },
  'article.comments': { fa: 'نظرات', en: 'Comments' },
  'article.commentPlaceholder': { fa: 'نظر خود را بنویسید...', en: 'Write your comment...' },
  'article.commentPlaceholderGuest': { fa: 'برای ثبت نظر وارد شوید', en: 'Login to comment' },
  'article.submitComment': { fa: 'ثبت نظر', en: 'Post Comment' },
  'article.commentingAs': { fa: 'با نام:', en: 'Posting as:' },
  'article.guestNote': { fa: 'برای ثبت نظر باید وارد شوید', en: 'You must be logged in to comment' },
  'article.noComments': { fa: 'هنوز نظری ثبت نشده. اولین نفر باشید!', en: 'No comments yet. Be the first!' },

  // Article not found
  'article.notFound': { fa: 'مطلب یافت نشد', en: 'Article not found' },
  'article.backToMagazine': { fa: 'بازگشت به مجله', en: 'Back to Magazine' },
  'video.notFound': { fa: 'ویدیو یافت نشد', en: 'Video not found' },

  // Language switcher
  'lang.fa': { fa: 'فارسی', en: 'Persian' },
  'lang.en': { fa: 'انگلیسی', en: 'English' },
  'lang.switch': { fa: 'تغییر زبان', en: 'Switch language' },
}

/** Returns a `t(key)` function that resolves the current language from the store. */
export function useT() {
  const lang = useStore((s) => s.lang)
  return (key: string): string => {
    const entry = DICT[key]
    if (!entry) return key
    return entry[lang] ?? entry.fa ?? key
  }
}

/** Plain (non-hook) version for places that can't use a hook. */
export function t(key: string, lang: 'fa' | 'en' = 'fa'): string {
  const entry = DICT[key]
  if (!entry) return key
  return entry[lang] ?? entry.fa ?? key
}

export { DICT }
