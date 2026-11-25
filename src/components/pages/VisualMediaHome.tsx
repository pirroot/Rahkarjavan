'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { useT } from '@/lib/i18n'
import { ArticleCard } from '@/components/article/ArticleCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Eye, Loader2, Sparkles, Radio, Clock, ArrowLeft, Flame } from 'lucide-react'
import { formatPersianNumber, timeAgo } from '@/lib/utils'

const PAGE_SIZE = 12

/** Generate a deterministic branded gradient + initial when no cover image. */
function useBrandCover(article: any) {
  if (!article) return null
  if (article.coverImage) return { type: 'img' as const, src: article.coverImage }
  // Deterministic color from title hash
  const palettes = [
    ['#dc2626', '#7f1d1d'], // red
    ['#1d4ed8', '#1e3a8a'], // blue
    ['#059669', '#064e3b'], // emerald
    ['#7c3aed', '#4c1d95'], // violet
    ['#d97706', '#78350f'], // amber
    ['#0891b2', '#155e75'], // cyan
    ['#be185d', '#831843'], // pink
    ['#4d7c0f', '#365314'], // lime
  ]
  let h = 0
  const t = article.title || ''
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0
  const [from, to] = palettes[h % palettes.length]
  const initial = (t || 'ر').charAt(0)
  return { type: 'brand' as const, from, to, initial, source: article.sourceName }
}

export function VisualMediaHome() {
  const { navigate } = useStore()
  const t = useT()
  const [heroArticle, setHeroArticle] = useState<any | null>(null)
  const [sideFeatured, setSideFeatured] = useState<any[]>([])
  const [breakingNews, setBreakingNews] = useState<any[]>([])
  const [articles, setArticles] = useState<any[]>([])
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
    ]).then(([feat, late]) => {
      const featured = feat.articles || []
      setHeroArticle(featured[0] || null)
      setSideFeatured(featured.slice(1, 5))
      const latest = late.articles || []
      // Top 6 latest become "breaking ticker"; rest go into the feed
      setBreakingNews(latest.slice(0, 8))
      setArticles(latest)
      setHasMore(latest.length === PAGE_SIZE)
      setCursor(latest.length > 0 ? latest[latest.length - 1].id : null)
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

  const heroCover = useBrandCover(heroArticle)

  return (
    <div className="animate-fade-in">
      {/* Breaking news ticker — top of page, full-width */}
      {breakingNews.length > 0 && (
        <div className="bg-destructive text-destructive-foreground border-b border-destructive/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 py-2">
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded text-xs font-bold whitespace-nowrap shrink-0">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                آخرین اخبار
              </span>
              <div className="relative flex-1 overflow-hidden">
                <div className="flex gap-6 animate-marquee whitespace-nowrap text-sm">
                  {[...breakingNews, ...breakingNews].map((a, i) => (
                    <button
                      key={i}
                      onClick={() => navigate('article', { slug: a.slug })}
                      className="hover:underline shrink-0"
                    >
                      <span className="opacity-70 ml-1">●</span>
                      {a.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section - Featured Article */}
      {heroArticle && (
        <section className="bg-black">
          <div className="container mx-auto px-4 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Main Hero — clickable */}
              <button
                onClick={() => navigate('article', { slug: heroArticle.slug })}
                className="lg:col-span-2 relative aspect-video bg-black rounded-xl overflow-hidden group text-right"
              >
                {heroCover?.type === 'img' ? (
                  <img
                    src={heroCover.src}
                    alt={heroArticle.title}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-90 transition-opacity"
                  />
                ) : heroCover?.type === 'brand' ? (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center text-white relative"
                    style={{ background: `linear-gradient(135deg, ${heroCover.from}, ${heroCover.to})` }}
                  >
                    <div className="absolute top-4 right-4 text-xs opacity-80 font-medium">{heroCover.source}</div>
                    <div className="text-7xl sm:text-9xl font-black opacity-30">{heroCover.initial}</div>
                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded font-bold">
                      {t('home.featured')}
                    </span>
                    {heroArticle.category && (
                      <span
                        className="text-xs px-2 py-0.5 rounded font-medium text-white"
                        style={{ backgroundColor: (heroArticle.category.color || '#888') + 'cc' }}
                      >
                        {heroArticle.category.name}
                      </span>
                    )}
                    {heroArticle.sourceName && (
                      <span className="text-xs text-white/70 px-2 py-0.5 rounded bg-white/10">
                        {heroArticle.sourceName}
                      </span>
                    )}
                  </div>
                  <h1 className="text-white font-bold text-xl sm:text-2xl lg:text-3xl mb-2 line-clamp-2 text-balance">
                    {heroArticle.title}
                  </h1>
                  {heroArticle.excerpt && (
                    <p className="text-white/80 text-sm line-clamp-2 mb-3 hidden sm:block">
                      {heroArticle.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-white/70">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {formatPersianNumber(heroArticle.views || 0)} بازدید
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo(heroArticle.createdAt)}
                    </span>
                  </div>
                </div>
              </button>

              {/* Side featured articles */}
              <div className="hidden lg:flex flex-col gap-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-orange-500" />
                    {t('home.selected')}
                  </h3>
                </div>
                {sideFeatured.slice(0, 4).map((a) => (
                  <SideNewsItem key={a.id} article={a} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Infinite-scroll feed — all latest articles */}
      <section className="container mx-auto px-4 my-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">{t('home.latest')}</h2>
              <p className="text-xs text-muted-foreground hidden sm:block">{t('home.latest.hint')}</p>
            </div>
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

/** Side news item — compact horizontal card with brand cover fallback. */
function SideNewsItem({ article }: { article: any }) {
  const { navigate } = useStore()
  const cover = useBrandCover(article)
  return (
    <button
      onClick={() => navigate('article', { slug: article.slug })}
      className="flex gap-3 text-right group bg-card border border-border rounded-lg p-2 hover:border-primary/40 transition-colors"
    >
      <div className="w-24 h-16 rounded-md overflow-hidden shrink-0 bg-secondary">
        {cover?.type === 'img' ? (
          <img src={cover.src} alt="" className="w-full h-full object-cover" />
        ) : cover?.type === 'brand' ? (
          <div
            className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
            style={{ background: `linear-gradient(135deg, ${cover.from}, ${cover.to})` }}
          >
            {cover.initial}
          </div>
        ) : null}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h4>
        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
          {article.category && <span style={{ color: article.category.color }}>● {article.category.name}</span>}
          <span className="flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            {timeAgo(article.createdAt)}
          </span>
        </div>
      </div>
    </button>
  )
}
