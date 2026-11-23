'use client'

import { create } from 'zustand'

export type PageKey =
  | 'home' // رسانه تصویری (صفحه اصلی)
  | 'magazine' // مجله خبری
  | 'category' // صفحه دسته‌بندی
  | 'article' // جزئیات خبر
  | 'video' // جزئیات ویدیو
  | 'about' // درباره ما
  | 'contact' // تماس با ما
  | 'search' // جستجو
  | 'auth' // ورود/ثبت‌نام
  | 'profile' // پنل کاربری
  | 'admin' // پنل مدیریت
  | 'legal' // حریم خصوصی و قوانین

export interface UserState {
  id: string
  email: string
  name: string | null
  displayName: string | null
  role: 'ADMIN' | 'EDITOR' | 'USER'
  avatar: string | null
  bio: string | null
  createdAt: string
}

interface AppState {
  // Navigation
  page: PageKey
  params: Record<string, string>
  navigate: (page: PageKey, params?: Record<string, string>) => void

  // UI state
  hamburgerOpen: boolean
  setHamburgerOpen: (open: boolean) => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void

  // Language
  lang: 'fa' | 'en'
  setLang: (lang: 'fa' | 'en') => void

  // User
  user: UserState | null
  setUser: (user: UserState | null) => void
  loadingUser: boolean
  setLoadingUser: (b: boolean) => void

  // Theme
  theme: 'dark' | 'light'
  toggleTheme: () => void
  setTheme: (t: 'dark' | 'light') => void

  // Settings
  settings: Record<string, string>
  setSettings: (s: Record<string, string>) => void
}

export const useStore = create<AppState>((set, get) => ({
  page: 'home',
  params: {},
  navigate: (page, params = {}) => {
    set({ page, params, hamburgerOpen: false, searchOpen: false })
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      // Update URL hash for shareable links
      const hash = buildHash(page, params)
      window.history.replaceState(null, '', hash ? `#${hash}` : '/')
    }
  },

  hamburgerOpen: false,
  setHamburgerOpen: (open) => set({ hamburgerOpen: open }),
  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),

  lang: 'fa',
  setLang: (lang) => {
    set({ lang })
    if (typeof window !== 'undefined') {
      document.documentElement.lang = lang
      document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr'
      try { window.localStorage.setItem('rj_lang', lang) } catch {}
    }
  },

  user: null,
  setUser: (user) => set({ user }),
  loadingUser: true,
  setLoadingUser: (b) => set({ loadingUser: b }),

  theme: 'dark',
  toggleTheme: () => {
    const t = get().theme === 'dark' ? 'light' : 'dark'
    set({ theme: t })
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('light', t === 'light')
    }
  },
  setTheme: (t) => {
    set({ theme: t })
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('light', t === 'light')
    }
  },

  settings: {},
  setSettings: (settings) => set({ settings }),
}))

function buildHash(page: PageKey, params: Record<string, string>): string {
  if (page === 'home') return ''
  if (page === 'magazine') return '/magazine'
  if (page === 'about') return '/about'
  if (page === 'contact') return '/contact'
  if (page === 'auth') return '/auth'
  if (page === 'profile') return '/profile'
  if (page === 'admin') {
    // Deep-link to a specific admin section when present, e.g. /admin?section=aggregator
    return params.section ? `/admin?section=${encodeURIComponent(params.section)}` : '/admin'
  }
  if (page === 'legal') return '/legal'
  if (page === 'search') return `/search?q=${encodeURIComponent(params.q || '')}`
  if (page === 'category') return `/category/${params.slug || ''}`
  if (page === 'article') return `/article/${params.slug || ''}`
  if (page === 'video') return `/video/${params.slug || ''}`
  return ''
}

export function parseHash(hash: string): { page: PageKey; params: Record<string, string> } {
  // Strip leading # and /
  let h = hash.replace(/^#/, '')
  if (h.startsWith('/')) h = h.slice(1)
  if (!h) return { page: 'home', params: {} }

  // Split path from query string
  const qIndex = h.indexOf('?')
  const path = qIndex >= 0 ? h.slice(0, qIndex) : h
  const queryStr = qIndex >= 0 ? h.slice(qIndex + 1) : ''
  const query = new URLSearchParams(queryStr)

  const parts = path.split('/').filter(Boolean)

  if (parts.length === 0) return { page: 'home', params: {} }
  if (parts[0] === 'magazine') return { page: 'magazine', params: {} }
  if (parts[0] === 'about') return { page: 'about', params: {} }
  if (parts[0] === 'contact') return { page: 'contact', params: {} }
  if (parts[0] === 'auth') return { page: 'auth', params: {} }
  if (parts[0] === 'profile') return { page: 'profile', params: {} }
  if (parts[0] === 'admin') return { page: 'admin', params: { section: query.get('section') || '' } }
  if (parts[0] === 'legal') return { page: 'legal', params: {} }
  if (parts[0] === 'search') {
    return { page: 'search', params: { q: query.get('q') || '' } }
  }
  if (parts[0] === 'category' && parts[1]) return { page: 'category', params: { slug: parts[1] } }
  if (parts[0] === 'article' && parts[1]) return { page: 'article', params: { slug: parts[1] } }
  if (parts[0] === 'video' && parts[1]) return { page: 'video', params: { slug: parts[1] } }
  return { page: 'home', params: {} }
}
