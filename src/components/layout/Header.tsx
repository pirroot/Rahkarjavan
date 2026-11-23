'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { useAuth, useSettings } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Menu as MenuIcon,
  Search,
  User as UserIcon,
  LogOut,
  Settings,
  Newspaper,
  Home,
  Phone,
  Info,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { useT } from '@/lib/i18n'

export function Header() {
  const { navigate, page, hamburgerOpen, setHamburgerOpen, searchOpen, setSearchOpen, user, lang } = useStore()
  const { logout } = useAuth()
  const settings = useSettings()
  const t = useT()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate('search', { q: searchQuery.trim() })
      setSearchOpen(false)
    }
  }

  const siteName = settings.site_name || 'راهکار جوان'
  const logoUrl = settings.logo_url || ''
  // English site name (from settings) when the UI is in English
  const siteNameDisplay = lang === 'en' && settings.site_name_en ? settings.site_name_en : siteName
  const slogan = lang === 'en' && settings.site_name_en ? t('slogan') : t('slogan')

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Hamburger Menu */}
          <div className="flex items-center gap-2">
            <Sheet open={hamburgerOpen} onOpenChange={setHamburgerOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-secondary" aria-label="منو">
                  <MenuIcon className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px] sm:w-[400px] bg-sidebar border-l border-sidebar-border p-0">
                <SheetHeader className="p-6 pb-4 border-b border-sidebar-border">
                  <SheetTitle className="text-right text-lg font-bold text-sidebar-foreground">
                    {t('nav.menu')}
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col p-4 gap-1">
                  <MenuLink icon={<Home className="h-4 w-4" />} label={t('nav.home')} onClick={() => navigate('home')} active={page === 'home'} />
                  <MenuLink icon={<Newspaper className="h-4 w-4" />} label={t('nav.magazine')} onClick={() => navigate('magazine')} active={page === 'magazine'} />
                  <MenuLink icon={<Info className="h-4 w-4" />} label={t('nav.about')} onClick={() => navigate('about')} active={page === 'about'} />
                  <MenuLink icon={<Phone className="h-4 w-4" />} label={t('nav.contact')} onClick={() => navigate('contact')} active={page === 'contact'} />

                  <div className="my-2 h-px bg-sidebar-border" />

                  {user ? (
                    <>
                      <MenuLink icon={<UserIcon className="h-4 w-4" />} label={t('nav.profile')} onClick={() => navigate('profile')} active={page === 'profile'} />
                      {(user.role === 'ADMIN' || user.role === 'EDITOR') && (
                        <MenuLink icon={<Settings className="h-4 w-4" />} label={t('nav.admin')} onClick={() => navigate('admin')} active={page === 'admin'} />
                      )}
                      <MenuLink icon={<LogOut className="h-4 w-4" />} label={t('nav.logout')} onClick={logout} active={false} danger />
                    </>
                  ) : (
                    <MenuLink icon={<UserIcon className="h-4 w-4" />} label={t('nav.login')} onClick={() => navigate('auth')} active={page === 'auth'} />
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo + Slogan */}
            <button
              onClick={() => navigate('home')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={siteName}
                  className="h-10 w-auto max-w-[160px] object-contain"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg brand-gradient flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
                  ر
                </div>
              )}
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-base font-bold text-foreground">{siteNameDisplay}</span>
                <span className="text-[10px] text-muted-foreground">{slogan}</span>
              </div>
            </button>
          </div>

          {/* Search (center) */}
          <div className="flex-1 max-w-md hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-secondary border-border pr-9 focus-visible:ring-primary"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Language toggle (fa ⇄ en) */}
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="جستجو"
            >
              {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>

            {user ? (
              <button onClick={() => navigate('profile')} className="flex items-center gap-2 hover:bg-secondary rounded-md px-2 py-1 transition-colors">
                <Avatar className="w-8 h-8 border border-border">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user.displayName?.charAt(0) || user.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm hidden lg:inline text-foreground">{user.displayName || user.name}</span>
              </button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => navigate('auth')} className="text-foreground hover:bg-secondary">
                <UserIcon className="h-4 w-4 ml-1" />
                <span className="hidden sm:inline">ورود</span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile search */}
        {searchOpen && (
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="bg-secondary border-border pr-9"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Breaking news ticker — placed BELOW the header bar (آخرین خبرها) */}
      <BreakingNewsTicker />
    </header>
  )
}

function MenuLink({
  icon,
  label,
  onClick,
  active,
  danger,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active: boolean
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-right',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-sidebar-foreground hover:bg-sidebar-accent',
        danger && 'text-destructive hover:bg-destructive/10'
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function BreakingNewsTicker() {
  const { navigate, lang } = useStore()
  const t = useT()
  const [items, setItems] = useState<{ id: string; title: string; titleEn?: string | null; slug: string }[]>([])

  useEffect(() => {
    fetch('/api/articles?sort=latest&limit=8')
      .then((r) => r.json())
      .then((d) => {
        if (d.articles) {
          setItems(d.articles.map((a: any) => ({ id: a.id, title: a.title, titleEn: a.titleEn, slug: a.slug })))
        }
      })
      .catch(() => {})
  }, [])

  if (items.length === 0) return null

  return (
    <div className="bg-primary text-primary-foreground py-1.5 overflow-hidden border-t border-primary-foreground/10">
      <div className="container mx-auto px-4 flex items-center gap-3">
        <span className="bg-primary-foreground text-primary px-2 py-0.5 text-xs font-bold rounded shrink-0">
          {t('ticker.label')}
        </span>
        <div className="flex-1 overflow-hidden">
          <div className="flex gap-8 animate-marquee whitespace-nowrap text-sm">
            {[...items, ...items].map((item, i) => (
              <span
                key={i}
                className="text-primary-foreground/90 cursor-pointer hover:text-primary-foreground"
                onClick={() => navigate('article', { slug: item.slug })}
              >
                {lang === 'en' && item.titleEn ? item.titleEn : item.title}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
