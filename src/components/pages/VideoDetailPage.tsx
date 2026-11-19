'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { VideoCard } from '@/components/video/VideoCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Play,
  Pause,
  Volume2,
  Maximize,
  Share2,
  Eye,
  Clock,
  ChevronLeft,
  Link2,
  Twitter,
  Send,
  Film,
} from 'lucide-react'
import { formatPersianNumber, timeAgo, formatPersianDateLong, videoTypeLabels } from '@/lib/utils'
import { toast } from 'sonner'

/** Whether the video URL is an embeddable iframe URL (YouTube/Aparat/Vimeo) rather than a direct file. */
function isEmbeddable(url: string): boolean {
  if (!url) return false
  const u = url.toLowerCase()
  return (
    u.includes('youtube.com/embed/') ||
    u.includes('aparat.com/video/video/embed/') ||
    u.includes('player.vimeo.com/')
  )
}

interface Props {
  slug: string
}

export function VideoDetailPage({ slug }: Props) {
  const { navigate } = useStore()
  const [data, setData] = useState<{ video: any; related: any[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setData(null)
    setPlaying(false)
    fetch(`/api/videos/${slug}`)
      .then(async (r) => {
        const json = await r.json()
        if (!r.ok) throw new Error(json.error || 'خطا')
        setData(json)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [slug])

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/#/video/${slug}` : ''
    try {
      if (navigator.share) {
        await navigator.share({ title: data?.video.title, url })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('لینک کپی شد')
      }
    } catch {
      // user cancelled
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-4">
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-destructive mb-4">{error || 'ویدیو یافت نشد'}</p>
        <Button onClick={() => navigate('home')}>بازگشت به خانه</Button>
      </div>
    )
  }

  const { video, related } = data

  return (
    <div className="animate-fade-in">
      <div className="container mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <button onClick={() => navigate('home')} className="hover:text-primary">راهکار جوان</button>
          <ChevronLeft className="h-4 w-4" />
          <button onClick={() => navigate('home')} className="hover:text-primary">رسانه تصویری</button>
          <ChevronLeft className="h-4 w-4" />
          <span className="text-foreground line-clamp-1">{video.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main content */}
          <div className="lg:col-span-3">
            {/* Video Player */}
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
              {isEmbeddable(video.videoUrl) ? (
                <iframe
                  src={video.videoUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  title={video.title}
                />
              ) : (
                <video
                  ref={setVideoEl}
                  src={video.videoUrl}
                  poster={video.coverImage}
                  controls
                  autoPlay={false}
                  className="w-full h-full"
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                />
              )}
            </div>

            {/* Title and meta */}
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                {video.category && (
                  <span
                    className="text-xs px-2 py-0.5 rounded font-medium text-white"
                    style={{ backgroundColor: video.category.color }
                    }
                  >
                    {video.category.name}
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                  {videoTypeLabels[video.videoType] || 'ویدیو'}
                </span>
                {video.isFeatured && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded font-bold">
                    ویژه
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-3 text-balance">
                {video.title}
              </h1>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {formatPersianNumber(video.views)} بازدید
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {video.duration}
                  </span>
                  <span>{timeAgo(video.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleShare}>
                    <Share2 className="h-4 w-4 ml-1" />
                    اشتراک‌گذاری
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div className="mt-4 text-muted-foreground leading-7 text-sm sm:text-base">
                {video.description}
              </div>

              {/* Source */}
              {video.sourceName && (
                <div className="mt-4 p-3 bg-secondary/50 rounded-md text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">منبع: </span>
                  {video.sourceName}
                  {video.sourceUrl && (
                    <a href={video.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary mr-2 hover:underline">
                      مشاهده منبع
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Related */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-3 sticky top-20">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2 px-2">
                <Film className="h-4 w-4 text-primary" />
                ویدیوهای مرتبط
              </h3>
              <div className="space-y-2 max-h-[80vh] overflow-y-auto">
                {related.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-2">ویدیو مرتبطی یافت نشد</p>
                ) : (
                  related.map((v) => (
                    <VideoCard key={v.id} video={v} variant="horizontal" />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* More videos section */}
        <section className="mt-10">
          <h2 className="text-lg font-bold text-foreground mb-4">ویدیوهای بیشتر</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {related.slice(0, 4).map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
