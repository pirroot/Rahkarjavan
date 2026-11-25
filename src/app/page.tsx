'use client'

import { useEffect } from 'react'
import { useStore, parseHash } from '@/lib/store'
import { useAuth } from '@/hooks/use-auth'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { VisualMediaHome } from '@/components/pages/VisualMediaHome'
import { VideoHome } from '@/components/pages/VideoHome'
import { MixedHome } from '@/components/pages/MixedHome'
import { MagazineHome } from '@/components/pages/MagazineHome'
import { VideoDetailPage } from '@/components/pages/VideoDetailPage'
import { ArticleDetailPage } from '@/components/pages/ArticleDetailPage'
import { CategoryPage } from '@/components/pages/CategoryPage'
import { AboutContactPage } from '@/components/pages/AboutContactPage'
import { SearchPage } from '@/components/pages/SearchPage'
import { AuthPage } from '@/components/pages/AuthPage'
import { UserPanelPage } from '@/components/pages/UserPanelPage'
import { AdminPanelPage } from '@/components/pages/AdminPanelPage'
import { LegalPage } from '@/components/pages/LegalPage'

export default function Home() {
  const { page, params, navigate, theme, setTheme, settings, setLang } = useStore()
  useAuth() // Initialize auth session

  // The admin chooses what the homepage shows via the SiteSetting
  // `home_content_type`. Supported values:
  //   - "article" (default) → VisualMediaHome (article-only editorial layout)
  //   - "video"             → VideoHome (video-only media layout)
  //   - "mixed"             → MixedHome (combined articles + videos editorial)
  const raw = (settings.home_content_type || 'article').toLowerCase()
  const homeMode: 'article' | 'video' | 'mixed' =
    raw === 'video' ? 'video' : raw === 'mixed' ? 'mixed' : 'article'

  // On mount, parse URL hash to determine initial page
  useEffect(() => {
    setTheme('dark') // Always dark theme (matches reference design)
    if (typeof window !== 'undefined') {
      // Restore the language the visitor last picked (fa is default)
      try {
        const savedLang = window.localStorage.getItem('rj_lang')
        if (savedLang === 'en' || savedLang === 'fa') setLang(savedLang)
      } catch {}
      const hash = window.location.hash.slice(1)
      if (hash) {
        const parsed = parseHash(hash)
        navigate(parsed.page, parsed.params)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Listen to hashchange (back/forward buttons)
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.slice(1)
      const parsed = parseHash(hash)
      // Use replaceState-style navigation (no extra history entry)
      useStore.setState({ page: parsed.page, params: parsed.params })
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // For admin page, render without header/footer (full-screen)
  if (page === 'admin') {
    return <AdminPanelPage />
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {page === 'home' && (
          homeMode === 'video' ? <VideoHome /> :
          homeMode === 'mixed' ? <MixedHome /> :
          <VisualMediaHome />
        )}
        {page === 'magazine' && <MagazineHome />}
        {page === 'video' && <VideoDetailPage slug={params.slug} />}
        {page === 'article' && <ArticleDetailPage slug={params.slug} />}
        {page === 'category' && <CategoryPage slug={params.slug} />}
        {page === 'about' && <AboutContactPage focus="about" />}
        {page === 'contact' && <AboutContactPage focus="contact" />}
        {page === 'search' && <SearchPage initialQuery={params.q} />}
        {page === 'auth' && <AuthPage />}
        {page === 'profile' && <UserPanelPage />}
        {page === 'legal' && <LegalPage />}
      </main>
      <Footer />
    </div>
  )
}
