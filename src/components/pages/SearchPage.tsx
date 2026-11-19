'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { ArticleCard } from '@/components/article/ArticleCard'
import { VideoCard } from '@/components/video/VideoCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Search as SearchIcon, ChevronLeft } from 'lucide-react'

interface Props {
  initialQuery?: string
}

export function SearchPage({ initialQuery = '' }: Props) {
  const { navigate } = useStore()
  const [query, setQuery] = useState(initialQuery)
  const [activeQuery, setActiveQuery] = useState(initialQuery)
  const [videos, setVideos] = useState<any[]>([])
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (initialQuery) {
      doSearch(initialQuery)
    }
  }, [initialQuery])

  const doSearch = async (q: string) => {
    if (!q.trim()) return
    setLoading(true)
    setSearched(true)
    setActiveQuery(q)
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const json = await r.json()
      setVideos(json.videos || [])
      setArticles(json.articles || [])
    } catch {
      setVideos([])
      setArticles([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doSearch(query)
  }

  return (
    <div className="animate-fade-in">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <button onClick={() => navigate('home')} className="hover:text-primary">راهکار جوان</button>
          <ChevronLeft className="h-4 w-4" />
          <span className="text-foreground">جستجو</span>
        </div>

        {/* Search form */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="text"
              placeholder="عبارت مورد نظر را جستجو کنید..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="text-base"
              autoFocus
            />
            <Button type="submit" disabled={loading}>
              <SearchIcon className="h-4 w-4 ml-1" />
              جستجو
            </Button>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-video rounded-lg" />)}
          </div>
        ) : !searched ? (
          <div className="text-center py-16">
            <SearchIcon className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">برای جستجو عبارتی وارد کنید</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              نتایج جستجو برای «<span className="text-foreground font-medium">{activeQuery}</span>»:
              {articles.length + videos.length} نتیجه
            </p>

            {articles.length === 0 && videos.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-4">نتیجه‌ای یافت نشد</p>
                <Button variant="outline" onClick={() => navigate('magazine')}>
                  مشاهده آخرین مطالب مجله
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {articles.length > 0 && (
                  <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">اخبار و مقالات ({articles.length})</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {articles.map((a) => <ArticleCard key={a.id} article={a} />)}
                    </div>
                  </section>
                )}

                {videos.length > 0 && (
                  <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">ویدیوها ({videos.length})</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                      {videos.map((v) => <VideoCard key={v.id} video={v} />)}
                    </div>
                  </section>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
