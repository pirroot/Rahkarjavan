'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { ArticleCard } from '@/components/article/ArticleCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, Flame, Sparkles, Clock, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPersianNumber, timeAgo } from '@/lib/utils'

export function MagazineHome() {
  const { navigate } = useStore()
  const [featured, setFeatured] = useState<any[]>([])
  const [latest, setLatest] = useState<any[]>([])
  const [popular, setPopular] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [activeCat, setActiveCat] = useState<string>('all')
  const [catArticles, setCatArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingCat, setLoadingCat] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/articles?featured=true&limit=5').then((r) => r.json()),
      fetch('/api/articles?sort=latest&limit=10').then((r) => r.json()),
      fetch('/api/articles?sort=popular&limit=6').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
    ]).then(([feat, late, pop, cats]) => {
      setFeatured(feat.articles || [])
      setLatest(late.articles || [])
      setPopular(pop.articles || [])
      setCategories(cats.categories || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    setLoadingCat(true)
    const url = activeCat === 'all'
      ? '/api/articles?sort=latest&limit=12'
      : `/api/articles?category=${activeCat}&limit=12`
    fetch(url)
      .then((r) => r.json())
      .then((d) => setCatArticles(d.articles || []))
      .catch(() => setCatArticles([]))
      .finally(() => setLoadingCat(false))
  }, [activeCat])

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

  const heroArticle = featured[0]
  const sideFeatured = featured.slice(1, 5)

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 pt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => navigate('home')} className="hover:text-primary">راهکار جوان</button>
          <ChevronLeft className="h-4 w-4" />
          <span className="text-foreground">مجله</span>
        </div>
      </div>

      {/* Hero article + side */}
      {heroArticle && (
        <section className="container mx-auto px-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <ArticleCard article={heroArticle} variant="featured" />
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-foreground">اخبار ویژه</h3>
              {sideFeatured.map((a) => (
                <ArticleCard key={a.id} article={a} variant="horizontal" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category filter */}
      <section className="container mx-auto px-4 mt-8">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <CatButton label="همه" active={activeCat === 'all'} onClick={() => setActiveCat('all')} />
          {categories
            .filter((c) => c.type === 'ARTICLE' || c.type === 'BOTH')
            .map((cat) => (
              <CatButton
                key={cat.id}
                label={cat.name}
                color={cat.color}
                active={activeCat === cat.slug}
                onClick={() => setActiveCat(cat.slug)}
              />
            ))}
        </div>
      </section>

      {/* Articles grid */}
      <section className="container mx-auto px-4 my-6">
        {loadingCat ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-lg" />)}
          </div>
        ) : catArticles.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            مطلبی در این دسته‌بندی یافت نشد
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {catArticles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        )}
      </section>

      {/* Popular Sidebar style */}
      {popular.length > 0 && (
        <section className="container mx-auto px-4 my-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SectionTitle icon={<TrendingUp className="h-5 w-5 text-orange-500" />} title="پربازدیدترین مطالب" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {popular.slice(0, 4).map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <SectionTitle icon={<Clock className="h-5 w-5 text-primary" />} title="آخرین مطالب" />
              <div className="space-y-2 mt-4">
                {latest.slice(0, 6).map((a) => (
                  <ArticleCard key={a.id} article={a} variant="horizontal" />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function CatButton({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-card text-foreground border-border hover:border-primary/50'
      )}
      style={active ? {} : color ? { borderColor: color + '80' } : {}}
    >
      {color && !active && <span style={{ color }}>●</span>} {label}
    </button>
  )
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
    </div>
  )
}
