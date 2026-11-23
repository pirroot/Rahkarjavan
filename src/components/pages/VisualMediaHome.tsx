'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { useT } from '@/lib/i18n'
import { ArticleCard } from '@/components/article/ArticleCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Eye, Loader2, Sparkles, Newspaper } from 'lucide-react'
import { formatPersianNumber, timeAgo } from '@/lib/utils'

const PAGE_SIZE = 12

export function VisualMediaHome() {
  const { navigate } = useStore()
  const t = useT()
  const [heroArticle, setHeroArticle] = useState<any | null>(null)
  const [sideFeatured, setSideFeatured] = useState<any[]>([])
  const [articles, setArticles] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Initial load
  useEffect(() => {
    Promise.all([
      fetch('/api/articles?featured=true&limit=5').then((r) => r.json()),
      fetch('/api/articles?sort=latest&limit=' + PAGE_SIZE).then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
    ]).then(([feat, late, cats]) => {
      const featured = feat.articles || []
      setHeroArticle(featured[0] || null)
      setSideFeatured(featured.slice(1, 5))
      const latest = late.articles || []
      setArticles(latest)
      setHasMore(latest.length === PAGE_SIZE)
      setCursor(latest.length > 0 ? latest[latest.length - 1].id : null)
      setCategories(cats.categories || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // Infinite scroll via IntersectionObserver
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const r = await fetch(`/api/articles?sort=latest&limit=${PAGE_SIZE}&after=${cursor || ''}`).then((r) => r.json())
      const more = r.articles || []
      if (more.length === 0) {
        setHasMore(false)
      } else {
        setArticles((prev) => [...prev, ...more])
        setCursor(more[more.length - 1].id)
        setHasMore(more.length === PAGE_SIZE)
      }
    } catch {} finally {
      setLoadingMore(false)
    }
  }, [cursor, hasMore, loadingMore])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore()
    }, { rootMargin: '400px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [loadMore])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Skeleton className="aspect-[16/9] w-full rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-video rounded-lg" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Hero Section - Featured Article (clickable, with inline video playback) */}
      {heroArticle && (
        <HeroArticle article={heroArticle} sideArticles={sideFeatured} />
      )}

      {/* Quick Category Filters */}
      <section className="container mx-auto px-4 mt-8">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => navigate('magazine')}
          >
            <Newspaper className="h-4 w-4 ml-1" />
            مجله خبری
          </Button>
          {categories
            .filter((c) => c.type === 'ARTICLE' || c.type === 'BOTH')
            .slice(0, 8)
            .map((cat) => (
              <Button
                key={cat.id}
                variant="outline"
                size="sm"
                className="shrink-0 hover:bg-primary hover:text-primary-foreground"
                style={{ borderColor: cat.color }}
                onClick={() => navigate('category', { slug: cat.slug })}
              >
                <span style={{ color: cat.color }}>●</span>
                {cat.name}
              </Button>
            ))}
        </div>
      </section>

      {/* Infinite-scroll feed — all latest articles */}
      <section className="container mx-auto px-4 my-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">{t('home.latest')}</h2>
            <p className="text-xs text-muted-foreground hidden sm:block">{t('home.latest.hint')}</p>
          </div>
        </div>
        {articles.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            {t('home.noNews')}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        )}

        {/* Infinite-scroll sentinel */}
        <div ref={sentinelRef} className="h-12 flex items-center justify-center mt-6">
          {loadingMore && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('home.loading')}
            </div>
          )}
          {!hasMore && articles.length > 0 && (
            <div className="text-xs text-muted-foreground">{t('home.endOfNews')}</div>
          )}
        </div>
      </section>
    </div>
  )
}

// Hero: featured article — clickable to article detail page.
function HeroArticle({ article, sideArticles }: { article: any; sideArticles: any[] }) {
  const { navigate } = useStore()
  const t = useT()

  return (
    <section className="relative bg-black">
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main Hero — clickable */}
          <button
            onClick={() => navigate('article', { slug: article.slug })}
            className="lg:col-span-2 relative aspect-video bg-black rounded-xl overflow-hidden group text-right"
          >
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-90 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            {/* Content overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded font-bold">
                  {t('home.featured')}
                </span>
                {article.category && (
                  <span
                    className="text-xs px-2 py-0.5 rounded font-medium text-white"
                    style={{ backgroundColor: (article.category.color || '#888') + 'cc' }}
                  >
                    {article.category.name}
                  </span>
                )}
              </div>
              <h1 className="text-white font-bold text-xl sm:text-2xl lg:text-3xl mb-2 line-clamp-2 text-balance">
                {article.title}
              </h1>
              {article.excerpt && (
                <p className="text-white/80 text-sm line-clamp-2 mb-3 hidden sm:block">
                  {article.excerpt}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-white/70">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {formatPersianNumber(article.views || 0)} بازدید
                </span>
                <span>•</span>
                <span>{timeAgo(article.createdAt)}</span>
              </div>
            </div>
          </button>

          {/* Side featured articles */}
          <div className="hidden lg:flex flex-col gap-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-foreground">{t('home.selected')}</h3>
              <span className="text-[10px] text-muted-foreground">{sideArticles.length} {t('nav.home')}</span>
            </div>
            {sideArticles.slice(0, 3).map((a) => (
              <ArticleCard key={a.id} article={a} variant="horizontal" />
            ))}
            <button
              onClick={() => navigate('magazine')}
              className="mt-auto bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg p-3 text-center transition-colors"
            >
              <span className="text-primary text-sm font-medium">{t('home.allFeatured')}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
