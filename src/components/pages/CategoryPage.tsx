'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { ArticleCard } from '@/components/article/ArticleCard'
import { VideoCard } from '@/components/video/VideoCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronLeft } from 'lucide-react'

interface Props {
  slug: string
}

export function CategoryPage({ slug }: Props) {
  const { navigate } = useStore()
  const [category, setCategory] = useState<any | null>(null)
  const [articles, setArticles] = useState<any[]>([])
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch(`/api/articles?category=${slug}&limit=20`).then((r) => r.json()),
      fetch(`/api/videos?category=${slug}&limit=20`).then((r) => r.json()),
    ]).then(([cats, arts, vids]) => {
      const cat = (cats.categories || []).find((c: any) => c.slug === slug)
      setCategory(cat || null)
      setArticles(arts.articles || [])
      setVideos(vids.videos || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-video rounded-lg" />)}
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-destructive mb-4">دسته‌بندی یافت نشد</p>
        <Button onClick={() => navigate('magazine')}>بازگشت به مجله</Button>
      </div>
    )
  }

  const hasArticles = articles.length > 0
  const hasVideos = videos.length > 0
  const showTabs = hasArticles && hasVideos

  return (
    <div className="animate-fade-in">
      {/* Category Header */}
      <section
        className="relative py-12 mb-6"
        style={{
          background: `linear-gradient(135deg, ${category.color}30 0%, transparent 100%)`,
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <button onClick={() => navigate('home')} className="hover:text-primary">راهکار جوان</button>
            <ChevronLeft className="h-4 w-4" />
            <span className="text-foreground">دسته‌بندی</span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: category.color }}
            >
              {category.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{category.name}</h1>
              {category.description && (
                <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-10">
        {showTabs ? (
          <Tabs defaultValue="articles">
            <TabsList>
              <TabsTrigger value="articles">مطالب ({articles.length})</TabsTrigger>
              <TabsTrigger value="videos">ویدیوها ({videos.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="articles" className="mt-6">
              <ArticlesGrid articles={articles} />
            </TabsContent>
            <TabsContent value="videos" className="mt-6">
              <VideosGrid videos={videos} />
            </TabsContent>
          </Tabs>
        ) : hasArticles ? (
          <ArticlesGrid articles={articles} />
        ) : hasVideos ? (
          <VideosGrid videos={videos} />
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            مطلبی در این دسته‌بندی یافت نشد
          </div>
        )}
      </div>
    </div>
  )
}

function ArticlesGrid({ articles }: { articles: any[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {articles.map((a) => <ArticleCard key={a.id} article={a} />)}
    </div>
  )
}

function VideosGrid({ videos }: { videos: any[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {videos.map((v) => <VideoCard key={v.id} video={v} />)}
    </div>
  )
}
