'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { ArticleCard } from '@/components/article/ArticleCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Eye,
  Clock,
  ChevronLeft,
  Share2,
  User,
  Tag,
  MessageCircle,
  Send,
  ExternalLink,
} from 'lucide-react'
import { formatPersianNumber, timeAgo, formatPersianDateLong } from '@/lib/utils'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { useStore as useZustandStore } from '@/lib/store'

interface Props {
  slug: string
}

export function ArticleDetailPage({ slug }: Props) {
  const { navigate, user } = useStore()
  const [data, setData] = useState<{ article: any; related: any[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setData(null)
    fetch(`/api/articles/${slug}`)
      .then(async (r) => {
        const json = await r.json()
        if (!r.ok) throw new Error(json.error || 'خطا')
        setData(json)
        setComments(json.article.comments || [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [slug])

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/#/article/${slug}` : ''
    try {
      if (navigator.share) {
        await navigator.share({ title: data?.article.title, url })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('لینک کپی شد')
      }
    } catch {
      // cancelled
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) {
      toast.error('نظر خود را وارد کنید')
      return
    }
    if (!user) {
      toast.error('برای ثبت نظر وارد شوید')
      navigate('auth')
      return
    }
    setSubmitting(true)
    try {
      const r = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: data?.article.id,
          content: comment,
        }),
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json.error || 'خطا')
      setComments([json.comment, ...comments])
      setComment('')
      toast.success('نظر شما ثبت شد')
    } catch (e: any) {
      toast.error(e.message || 'خطا در ثبت نظر')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-4">
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-destructive mb-4">{error || 'مطلب یافت نشد'}</p>
        <Button onClick={() => navigate('magazine')}>بازگشت به مجله</Button>
      </div>
    )
  }

  const { article, related } = data

  return (
    <div className="animate-fade-in">
      <div className="container mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <button onClick={() => navigate('home')} className="hover:text-primary">راهکار جوان</button>
          <ChevronLeft className="h-4 w-4" />
          <button onClick={() => navigate('magazine')} className="hover:text-primary">مجله</button>
          {article.category && (
            <>
              <ChevronLeft className="h-4 w-4" />
              <button onClick={() => navigate('category', { slug: article.category.slug })} className="hover:text-primary">
                {article.category.name}
              </button>
            </>
          )}
          <ChevronLeft className="h-4 w-4" />
          <span className="text-foreground line-clamp-1">{article.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main content */}
          <article className="lg:col-span-3">
            {/* Cover image */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-secondary mb-4">
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-full object-cover"
              />
              {article.isBreaking && (
                <span className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-sm px-3 py-1 rounded font-bold">
                  فوری
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 text-balance leading-tight">
              {article.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pb-4 border-b border-border">
              {article.author && (
                <div className="flex items-center gap-2">
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={article.author.avatar || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {(article.author.displayName || article.author.name || 'A').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-foreground">{article.author.displayName || article.author.name}</span>
                </div>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatPersianDateLong(article.publishedAt || article.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {formatPersianNumber(article.views)} بازدید
              </span>
              <Button size="sm" variant="outline" onClick={handleShare} className="mr-auto">
                <Share2 className="h-4 w-4 ml-1" />
                اشتراک‌گذاری
              </Button>
            </div>

            {/* Excerpt */}
            <div className="mt-4 text-base sm:text-lg text-muted-foreground leading-8 font-medium border-r-4 border-primary pr-4 py-2">
              {article.excerpt}
            </div>

            {/* Content */}
            <div
              className="article-content mt-6"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Source attribution banner (for AI-generated news) */}
            {article.sourceUrl && article.sourceName && (
              <div className="mt-6 p-4 bg-secondary/50 border border-border rounded-lg flex items-start gap-3">
                <ExternalLink className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-foreground mb-1">
                    <span className="font-bold">منبع خبر: </span>
                    <span>{article.sourceName}</span>
                  </p>
                  <a
                    href={article.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    dir="ltr"
                  >
                    مشاهده خبر در سایت منبع
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {article.aiGenerated && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      این خبر با الهام از خبر منبع و با بازنویسی توسط هوش مصنوعی تهیه شده است.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {article.tags && (
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  {article.tags.split(',').map((tag: string, i: number) => (
                    <span key={i} className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded-md">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Comments section */}
            <section className="mt-10">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                نظرات ({formatPersianNumber(comments.length)})
              </h2>

              {/* Comment form */}
              <form onSubmit={handleSubmitComment} className="mb-6">
                <Textarea
                  placeholder={user ? 'نظر خود را بنویسید...' : 'برای ثبت نظر وارد شوید'}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={!user}
                  rows={3}
                  className="bg-card"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    {user ? `با نام: ${user.displayName || user.name}` : 'برای ثبت نظر باید وارد شوید'}
                  </span>
                  <Button type="submit" disabled={submitting || !user}>
                    {submitting ? 'در حال ثبت...' : 'ثبت نظر'}
                  </Button>
                </div>
              </form>

              {/* Comments list */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    هنوز نظری ثبت نشده. اولین نفر باشید!
                  </p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="bg-card border border-border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                            {c.authorName?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-foreground">{c.authorName}</div>
                          <div className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-6">{c.content}</p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-3 sticky top-20">
              <h3 className="text-sm font-bold text-foreground mb-3 px-2">مطالب مرتبط</h3>
              <div className="space-y-2">
                {related.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-2">مطلب مرتبطی یافت نشد</p>
                ) : (
                  related.map((a) => (
                    <ArticleCard key={a.id} article={a} variant="horizontal" />
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* More articles */}
        <section className="mt-10">
          <h2 className="text-lg font-bold text-foreground mb-4">مطالب بیشتر</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {related.slice(0, 3).map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
