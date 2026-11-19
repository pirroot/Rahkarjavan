'use client'

import { useStore } from '@/lib/store'
import { Play, Eye, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toPersianDigits, formatPersianNumber, videoTypeLabels, timeAgo } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface VideoCardProps {
  video: any
  variant?: 'default' | 'compact' | 'large' | 'horizontal'
  className?: string
}

export function VideoCard({ video, variant = 'default', className }: VideoCardProps) {
  const { navigate } = useStore()

  if (variant === 'horizontal') {
    return (
      <button
        onClick={() => navigate('video', { slug: video.slug })}
        className={cn(
          'group flex gap-3 text-right w-full hover:bg-secondary/50 p-2 rounded-md transition-colors',
          className
        )}
      >
        <div className="relative w-32 h-20 shrink-0 rounded-md overflow-hidden bg-secondary">
          <img
            src={video.coverImage}
            alt={video.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <Play className="h-6 w-6 text-white fill-white" />
          </div>
          <span className="absolute bottom-1 left-1 bg-black/80 text-white text-[10px] px-1 rounded">
            {video.duration}
          </span>
        </div>
        <div className="flex-1 min-w-0 py-1">
          <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {video.title}
          </h4>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Eye className="h-3 w-3" />
              {formatPersianNumber(video.views)}
            </span>
            <span>•</span>
            <span>{timeAgo(video.createdAt)}</span>
          </div>
        </div>
      </button>
    )
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={() => navigate('video', { slug: video.slug })}
        className="group text-right w-full"
      >
        <div className="relative aspect-video rounded-md overflow-hidden bg-secondary mb-2">
          <img
            src={video.coverImage}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="h-4 w-4 text-primary-foreground fill-primary-foreground mr-0.5" />
            </div>
          </div>
          <span className="absolute bottom-1 left-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded">
            {video.duration}
          </span>
        </div>
        <h4 className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {video.title}
        </h4>
      </button>
    )
  }

  return (
    <button
      onClick={() => navigate('video', { slug: video.slug })}
      className={cn(
        'group text-right w-full bg-card rounded-lg overflow-hidden border border-border hover:border-primary/40 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5',
        variant === 'large' && 'shadow-md',
        className
      )}
    >
      <div className={cn(
        'relative overflow-hidden bg-secondary',
        variant === 'large' ? 'aspect-[16/9]' : 'aspect-video'
      )}>
        <img
          src={video.coverImage}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center scale-75 group-hover:scale-100 transition-transform">
            <Play className="h-6 w-6 text-primary-foreground fill-primary-foreground mr-1" />
          </div>
        </div>

        {/* Duration badge */}
        <span className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {video.duration}
        </span>

        {/* Featured badge */}
        {video.isFeatured && (
          <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded font-bold">
            ویژه
          </span>
        )}

        {/* Category badge */}
        {video.category && (
          <span
            className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded font-medium text-white"
            style={{ backgroundColor: video.category.color + 'cc' }}
          >
            {video.category.name}
          </span>
        )}

        {/* Title overlay on large variant */}
        {variant === 'large' && (
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-bold text-lg line-clamp-2 mb-2">{video.title}</h3>
            <div className="flex items-center gap-3 text-xs text-white/80">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {formatPersianNumber(video.views)} بازدید
              </span>
              <span>•</span>
              <span>{timeAgo(video.createdAt)}</span>
            </div>
          </div>
        )}
      </div>

      {variant !== 'large' && (
        <div className="p-3">
          <h3 className="font-medium text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors mb-2">
            {video.title}
          </h3>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatPersianNumber(video.views)}
            </span>
            <span>{timeAgo(video.createdAt)}</span>
          </div>
        </div>
      )}
    </button>
  )
}
