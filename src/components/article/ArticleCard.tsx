'use client'

import { useStore } from '@/lib/store'
import { Eye, Clock, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatPersianNumber, timeAgo, formatPersianDateLong } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ArticleCardProps {
  article: any
  variant?: 'default' | 'featured' | 'compact' | 'horizontal'
  className?: string
}

export function ArticleCard({ article, variant = 'default', className }: ArticleCardProps) {
  const { navigate } = useStore()

  if (variant === 'horizontal') {
    return (
      <button
        onClick={() => navigate('article', { slug: article.slug })}
        className="group flex gap-3 text-right w-full hover:bg-secondary/50 p-2 rounded-md transition-colors"
      >
        <div className="w-24 h-20 shrink-0 rounded-md overflow-hidden bg-secondary">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            loading="lazy"
          />
        </div>
        <div className="flex-1 min-w-0 py-1">
          {article.category && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium text-white inline-block mb-1"
              style={{ backgroundColor: article.category.color + 'cc' }}
            >
              {article.category.name}
            </span>
          )}
          <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h4>
          <div className="text-[11px] text-muted-foreground mt-1">
            {timeAgo(article.publishedAt || article.createdAt)}
          </div>
        </div>
      </button>
    )
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={() => navigate('article', { slug: article.slug })}
        className="group text-right w-full"
      >
        <div className="relative aspect-video rounded-md overflow-hidden bg-secondary mb-2">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {article.isBreaking && (
            <span className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded font-bold">
              فوری
            </span>
          )}
        </div>
        <h4 className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h4>
      </button>
    )
  }

  if (variant === 'featured') {
    return (
      <button
        onClick={() => navigate('article', { slug: article.slug })}
        className={cn(
          'group relative block w-full text-right overflow-hidden rounded-xl',
          className
        )}
      >
        <div className="aspect-[16/10] sm:aspect-[16/9] overflow-hidden bg-secondary">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        <div className="absolute top-3 right-3 flex gap-2">
          {article.isBreaking && (
            <span className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded font-bold">
              فوری
            </span>
          )}
          {article.category && (
            <span
              className="text-xs px-2 py-1 rounded font-medium text-white"
              style={{ backgroundColor: article.category.color }}
            >
              {article.category.name}
            </span>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
          {article.isFeatured && (
            <span className="inline-block bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded mb-2 font-bold">
              ویژه
            </span>
          )}
          <h3 className="text-white font-bold text-lg sm:text-2xl leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors text-balance">
            {article.title}
          </h3>
          <p className="text-white/80 text-sm line-clamp-2 mb-3 hidden sm:block">
            {article.excerpt}
          </p>
          <div className="flex items-center gap-3 text-xs text-white/70">
            {article.author && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {article.author.displayName || article.author.name}
              </span>
            )}
            <span>•</span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatPersianNumber(article.views)}
            </span>
            <span>•</span>
            <span>{formatPersianDateLong(article.publishedAt || article.createdAt)}</span>
          </div>
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={() => navigate('article', { slug: article.slug })}
      className={cn(
        'group text-right w-full bg-card rounded-lg overflow-hidden border border-border hover:border-primary/40 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 flex flex-col',
        className
      )}
    >
      <div className="relative aspect-video overflow-hidden bg-secondary">
        <img
          src={article.coverImage}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-2 right-2 flex gap-1">
          {article.isBreaking && (
            <span className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded font-bold">
              فوری
            </span>
          )}
          {article.isFeatured && (
            <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded font-bold">
              ویژه
            </span>
          )}
        </div>
        {article.category && (
          <span
            className="absolute bottom-2 right-2 text-[10px] px-2 py-0.5 rounded font-medium text-white"
            style={{ backgroundColor: article.category.color + 'cc' }}
          >
            {article.category.name}
          </span>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-medium text-foreground text-sm leading-6 line-clamp-2 group-hover:text-primary transition-colors mb-2">
          {article.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
          {article.excerpt}
        </p>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {formatPersianNumber(article.views)}
          </span>
          <span>{timeAgo(article.publishedAt || article.createdAt)}</span>
        </div>
      </div>
    </button>
  )
}
