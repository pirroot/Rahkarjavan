// Helper utilities
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Convert English digits to Persian
export function toPersianDigits(input: string | number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(input).replace(/[0-9]/g, (d) => persianDigits[parseInt(d, 10)])
}

// Format number with Persian digits and thousands separator
export function formatPersianNumber(n: number): string {
  return toPersianDigits(n.toLocaleString('en-US'))
}

// Format date to Persian (Jalali) format - approximation
const persianMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
]

// Convert Gregorian date to Jalali (Persian) calendar
export function toJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  let jy = (gy <= 1600) ? 0 : 979
  gy -= (gy <= 1600) ? 621 : 1600
  let gy2 = (gm > 2) ? (gy + 1) : gy
  let days = (365 * gy) + (Math.floor((gy2 + 3) / 4)) - (Math.floor((gy2 + 99) / 100)) + (Math.floor((gy2 + 399) / 400)) - 80 + gd + g_d_m[gm - 1]
  jy += 33 * (Math.floor(days / 12053))
  days %= 12053
  jy += 4 * (Math.floor(days / 1461))
  days %= 1461
  if (days > 365) {
    jy += Math.floor((days - 1) / 365)
    days = (days - 1) % 365
  }
  const jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30)
  const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30))
  return [jy, jm, jd]
}

export function formatPersianDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const [jy, jm, jd] = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate())
  return `${toPersianDigits(jy)}/${toPersianDigits(jm)}/${toPersianDigits(jd)}`
}

export function formatPersianDateLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const [jy, jm, jd] = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate())
  return `${toPersianDigits(jd)} ${persianMonths[jm - 1]} ${toPersianDigits(jy)}`
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seconds < 60) return 'لحظاتی پیش'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${toPersianDigits(minutes)} دقیقه پیش`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${toPersianDigits(hours)} ساعت پیش`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${toPersianDigits(days)} روز پیش`
  const months = Math.floor(days / 30)
  if (months < 12) return `${toPersianDigits(months)} ماه پیش`
  return `${toPersianDigits(Math.floor(months / 12))} سال پیش`
}

// Generate slug from title
export function slugify(text: string): string {
  return text
    .toString()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FF\w-]/g, '')
    .toLowerCase()
}

// Video type labels in Persian
export const videoTypeLabels: Record<string, string> = {
  NEWS: 'ویدیو خبری',
  INTERVIEW: 'مصاحبه',
  REPORT: 'گزارش تصویری',
  DOCUMENTARY: 'مستند',
  CHARITY: 'خیریه',
  SPECIAL: 'گزارش ویژه',
}

export const categoryTypeLabels: Record<string, string> = {
  VIDEO: 'ویدیو',
  ARTICLE: 'مقاله',
  BOTH: 'هر دو',
}

export const userRoleLabels: Record<string, string> = {
  ADMIN: 'مدیر',
  EDITOR: 'سردبیر',
  USER: 'کاربر',
}

export const articleStatusLabels: Record<string, string> = {
  DRAFT: 'پیش‌نویس',
  PUBLISHED: 'منتشر شده',
  SCHEDULED: 'زمان‌بندی شده',
}
