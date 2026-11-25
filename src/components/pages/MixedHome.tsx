'use client'

// MixedHome — homepage mode that combines articles and videos.
// پایگاه خبری راهکار جوان
//
// When the admin selects "mixed" as the homepage content type, the homepage
// shows a combined editorial layout:
//   1. A hero with the single most important item (featured article OR
//      featured video, whichever was published more recently).
//   2. A "breaking news" ticker of recent articles.
//   3. A "featured" row alternating article and video cards.
//   4. Two side-by-side feeds: latest articles and latest videos.
//
// This is a genuinely different layout from both VisualMediaHome (article
// only) and VideoHome (video only) — we don't simply stack those two.

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { useT } from '@/lib/i18n'
import { ArticleCard } from '@/components/article/ArticleCard'
import { VideoCard } from '@/components/video/VideoCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Play, Newspaper, Flame, Clock, TrendingUp, ChevronLeft } from 'lucide-react'
import { formatPersianNumber, timeAgo } from '@/lib/utils'

interface ArticleLite {
  id: string
  title: string
  slug: string
  excerpt?: string
  coverImage?: string
  isBreaking?: boolean
  publishedAt?: string
  createdAt?: string
  views?: number
  category?: { name: string; color: string; slug: string } | null
  sourceName?: string
}

interface VideoLite {
  id: string
  title: string
  slug: string
  description?: string
  coverImage?: string
  duration?: string
  views?: number
  isFeatured?: boolean
  createdAt?: string
  category?: { name: string; color: string; slug: string } | null
}

export function MixedHome() {
  const { navigate } = useStore()
  const t = useT()
  const [heroArticle, setHeroArticle] = useState<ArticleLite | null>(null)
  const [heroVideo, setHeroVideo] = useState<VideoLite | null>(null)
  const [breaking, setBreaking] = useState<ArticleLite[]>([])
  const [featuredArticles, setFeaturedArticles] = useState<ArticleLite[]>([])
  const [featuredVideos, setFeaturedVideos] = useState<VideoLite[]>([])
  const [latestArticles, setLatestArticles] = useState<ArticleLite[]>([])
  const [latestVideos, setLatestVideos] = useState<VideoLite[]>([])
  const [popularArticles, setPopularArticles] = useState<ArticleLite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/articles?featured=true&limit=5').then((r) => r.json()),
      fetch('/api/articles?sort=latest&limit=8').then((r) => r.json()),
      fetch('/api/articles?sort=popular&limit=5').then((r) => r.json()),
      fetch('/api/videos?featured=true&limit=5').then((r) => r.json()),
      fetch('/api/videos?sort=latest&limit=8').then((r) => r.json()),
    ])
      .then(([featArt, lateArt, popArt, featVid, lateVid]) => {
        const fa = (featArt.articles || []) as ArticleLite[]
        const la = (lateArt.articles || []) as ArticleLite[]
        const pa = (popArt.articles || []) as ArticleLite[]
        const fv = (featVid.videos || []) as VideoLite[]
        const lv = (lateVid.videos || []) as VideoLite[]
        setFeaturedArticles(fa.slice(0, 4))
        setFeaturedVideos(fv.slice(0, 4))
        setLatestArticles(la)
        setLatestVideos(lv)
        setPopularArticles(pa)
        setBreaking(la.slice(0, 6))
        // Pick the hero: the most recent featured article OR the most recent
        // featured video — whichever was published/created later wins.
        const topArt = fa[0]
        const topVid = fv[0]
        if (topArt && topVid) {
          const aT = new Date(topArt.publishedAt || topArt.createdAt || 0).getTime()
          const vT = new Date(topVid.createdAt || 0).getTime()
          if (vT > aT) {
            setHeroVideo(topVid)
            setHeroArticle(fa[1] || null)
          } else {
            setHeroArticle(topArt)
            setHeroVideo(fv[1] || null)
          }
        } else if (topArt) {
          setHeroArticle(topArt)
          setHeroVideo(fv[0] || null)
        } else if (topVid) {
          setHeroVideo(topVid)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

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
      {/* Hero — featured item (article or video) */}
      {heroArticle && <HeroArticleCard article={heroArticle} />}
      {heroVideo && !heroArticle && <HeroVideoCard video={heroVideo} />}

      {/* Breaking news ticker (آخرین خبرها) */}
      {breaking.length > 0 && (
        <section className="bg-card/60 border-y border-border">
          <div className="container mx-auto px-4 py-2 flex items-center gap-3 overflow-hidden">
            <span className="flex items-center gap-1 shrink-0 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded font-bold">
              <Flame className="h-3 w-3" />
              {t('ticker.label')}
            </span>
            <div className="flex gap-4 overflow-x-auto no-scrollbar text-sm text-muted-foreground">
              {breaking.map((a) => (
                <button
                  key={a.id}
                  onClick={() => navigate('article', { slug: a.slug })}
                  className="whitespace-nowrap hover:text-primary transition-colors"
                >
                  <span className="text-primary font-medium">•</span>{' '}
                  {a.title}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Secondary hero (the other type) */}
      {heroVideo && heroArticle && (
        <section className="container mx-auto px-4 mt-6">
          <SectionTitle icon={<Play className="h-5 w-5 text-primary" />} title={t('home.videoFeatured')} action={() => navigate('magazine')} />
          <div className="mt-3">
            <HeroVideoCard video={heroVideo} compact />
          </div>
        </section>
      )}

      {/* Featured row — alternating article and video cards */}
      {(featuredArticles.length > 0 || featuredVideos.length > 0) && (
        <section className="container mx-auto px-4 mt-8">
          <SectionTitle icon={<Flame className="h-5 w-5 text-primary" />} title={t('home.featured')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {interleave(featuredArticles, featuredVideos).slice(0, 4).map((item, i) =>
              isArticle(item) ? (
                <ArticleCard key={`a-${item.id}`} article={item} />
              ) : (
                <VideoCard key={`v-${item.id}`} video={item} />
              )
            )}
          </div>
        </section>
      )}

      {/* Two parallel feeds: latest articles + latest videos */}
      <section className="container mx-auto px-4 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest articles */}
        <div className="lg:col-span-2">
          <SectionTitle
            icon={<Newspaper className="h-5 w-5 text-primary" />}
            title={t('home.latest')}
            action={() => navigate('magazine')}
            actionLabel={t('home.allFeatured')}
          />
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {latestArticles.slice(0, 6).map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </div>

        {/* Latest videos sidebar */}
        <aside>
          <div className="bg-card border border-border rounded-xl p-4">
            <SectionTitle
              icon={<Play className="h-5 w-5 text-primary" />}
              title={t('home.latestVideos')}
              action={() => navigate('magazine')}
              actionLabel={t('home.allFeaturedVideos')}
            />
            <div className="space-y-2 mt-4">
              {latestVideos.slice(0, 5).map((v) => (
                <VideoCard key={v.id} video={v} variant="horizontal" />
              ))}
              {latestVideos.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">{t('home.noVideos')}</p>
              )}
            </div>
          </div>
        </aside>
      </section>

      {/* Popular articles */}
      {popularArticles.length > 0 && (
        <section className="container mx-auto px-4 mt-10 mb-12">
          <SectionTitle icon={<TrendingUp className="h-5 w-5 text-orange-500" />} title="پربازدیدترین مطالب" />
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularArticles.slice(0, 4).map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ---------- Helpers ----------

function SectionTitle({
  icon,
  title,
  action,
  actionLabel,
}: {
  icon: React.ReactNode
  title: string
  action?: () => void
  actionLabel?: string
}) {
  const { t } = useStore() as any
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg sm:text-xl font-bold text-foreground">{title}</h2>
      </div>
      {action && actionLabel && (
        <button onClick={action} className="text-xs text-primary hover:underline flex items-center gap-1">
          {actionLabel}
          <ChevronLeft className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

function isArticle(x: ArticleLite | VideoLite): x is ArticleLite {
  return (x as ArticleLite).excerpt !== undefined || (x as VideoLite).duration === undefined
}

/** Interleave two arrays, e.g. [a1,a2] + [v1,v2] -> [a1,v1,a2,v2]. */
function interleave<T, U>(a: T[], b: U[]): (T | U)[] {
  const out: (T | U)[] = []
  const n = Math.max(a.length, b.length)
  for (let i = 0; i < n; i++) {
    if (a[i] !== undefined) out.push(a[i])
    if (b[i] !== undefined) out.push(b[i])
  }
  return out
}

// ---------- Hero sub-components ----------

function HeroArticleCard({ article }: { article: ArticleLite }) {
  const { navigate } = useStore()
  const t = useT()
  return (
    <section className="relative bg-black">
      <div className="container mx-auto px-4 py-4">
        <button
          onClick={() => navigate('article', { slug: article.slug })}
          className="relative w-full aspect-[16/9] sm:aspect-[21/9] bg-black rounded-xl overflow-hidden group text-right"
        >
          {article.coverImage ? (
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-90 transition-opacity"
            />
          ) : (
            <div className="w-full h-full brand-gradient" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded font-bold">
                {t('home.featured')}
              </span>
              {article.isBreaking && (
                <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded font-bold">
                  {t('article.breaking')}
                </span>
              )}
              {article.category && (
                <span
                  className="text-xs px-2 py-0.5 rounded font-medium text-white"
                  style={{ backgroundColor: (article.category.color || '#888') + 'cc' }}
                >
                  {article.category.name}
                </span>
              )}
            </div>
            <h1 className="text-white font-bold text-2xl sm:text-3xl lg:text-4xl mb-3 line-clamp-2 text-balance max-w-3xl">
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="text-white/80 text-sm sm:text-base line-clamp-2 mb-3 max-w-2xl hidden sm:block">
                {article.excerpt}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-white/70">
              <span>{timeAgo(article.publishedAt || article.createdAt || new Date().toISOString())}</span>
              {article.views ? (
                <>
                  <span>•</span>
                  <span>{formatPersianNumber(article.views)} {t('article.views')}</span>
                </>
              ) : null}
            </div>
          </div>
        </button>
      </div>
    </section>
  )
}

function HeroVideoCard({ video, compact }: { video: VideoLite; compact?: boolean }) {
  const { navigate } = useStore()
  const t = useT()
  return (
    <section className={compact ? '' : 'relative bg-black'}>
      <div className={compact ? '' : 'container mx-auto px-4 py-4'}>
        <button
          onClick={() => navigate('video', { slug: video.slug })}
          className={`relative w-full ${compact ? 'aspect-video' : 'aspect-[16/9] sm:aspect-[21/9]'} bg-black rounded-xl overflow-hidden group text-right`}
        >
          {video.coverImage ? (
            <img
              src={video.coverImage}
              alt={video.title}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-90 transition-opacity"
            />
          ) : (
            <div className="w-full h-full brand-gradient" />
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="h-7 w-7 text-primary-foreground ml-1" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded font-bold">
                {t('home.videoFeatured')}
              </span>
              {video.category && (
                <span
                  className="text-xs px-2 py-0.5 rounded font-medium text-white"
                  style={{ backgroundColor: (video.category.color || '#888') + 'cc' }}
                >
                  {video.category.name}
                </span>
              )}
            </div>
            <h2 className={`text-white font-bold ${compact ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'} mb-2 line-clamp-2`}>
              {video.title}
            </h2>
            {video.description && !compact && (
              <p className="text-white/80 text-sm line-clamp-2 mb-2 max-w-2xl hidden sm:block">
                {video.description}
              </p>
            )}
          </div>
        </button>
      </div>
    </section>
  )
}
