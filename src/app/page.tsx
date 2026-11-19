'use client'

import { useEffect } from 'react'
import { useStore, parseHash } from '@/lib/store'
import { useAuth } from '@/hooks/use-auth'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { VisualMediaHome } from '@/components/pages/VisualMediaHome'
import { MagazineHome } from '@/components/pages/MagazineHome'
import { VideoDetailPage } from '@/components/pages/VideoDetailPage'
import { ArticleDetailPage } from '@/components/pages/ArticleDetailPage'
import { CategoryPage } from '@/components/pages/CategoryPage'
import { AboutPage } from '@/components/pages/AboutPage'
import { ContactPage } from '@/components/pages/ContactPage'
import { SearchPage } from '@/components/pages/SearchPage'
import { AuthPage } from '@/components/pages/AuthPage'
import { UserPanelPage } from '@/components/pages/UserPanelPage'
import { AdminPanelPage } from '@/components/pages/AdminPanelPage'
import { LegalPage } from '@/components/pages/LegalPage'

export default function Home() {
  const { page, params, navigate, theme, setTheme } = useStore()
  useAuth() // Initialize auth session

  // On mount, parse URL hash to determine initial page
  useEffect(() => {
    setTheme('dark') // Always dark theme (matches reference design)
    if (typeof window !== 'undefined') {
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
        {page === 'home' && <VisualMediaHome />}
        {page === 'magazine' && <MagazineHome />}
        {page === 'video' && <VideoDetailPage slug={params.slug} />}
        {page === 'article' && <ArticleDetailPage slug={params.slug} />}
        {page === 'category' && <CategoryPage slug={params.slug} />}
        {page === 'about' && <AboutPage />}
        {page === 'contact' && <ContactPage />}
        {page === 'search' && <SearchPage initialQuery={params.q} />}
        {page === 'auth' && <AuthPage />}
        {page === 'profile' && <UserPanelPage />}
        {page === 'legal' && <LegalPage />}
      </main>
      <Footer />
    </div>
  )
}
