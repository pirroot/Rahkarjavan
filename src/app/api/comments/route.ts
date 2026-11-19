import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, getClientIp } from '@/lib/auth'
import { checkRateLimit, formatRateLimitError, setRateLimitHeaders } from '@/lib/rate-limit'
import { z } from 'zod'

const commentSchema = z.object({
  articleId: z.string(),
  content: z.string().min(3, 'کامنت باید حداقل ۳ کاراکتر باشد').max(1000, 'کامنت طولانی است'),
  authorName: z.string().min(2, 'نام را وارد کنید').optional(),
  authorEmail: z.string().email('ایمیل معتبر نیست').optional(),
})

export async function POST(req: NextRequest) {
  // Rate limit: 5 comments per 10 minutes per IP
  const ip = getClientIp(req)
  const rateLimit = await checkRateLimit('comment', ip)
  if (!rateLimit.success) {
    const res = NextResponse.json(
      { error: formatRateLimitError(rateLimit.resetAt) },
      { status: 429 }
    )
    setRateLimitHeaders(res, rateLimit)
    return res
  }

  try {
    const body = await req.json()
    const parsed = commentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'اطلاعات نامعتبر' }, { status: 400 })
    }
    const { articleId, content, authorName, authorEmail } = parsed.data
    const session = await getSession()

    const article = await db.article.findUnique({ where: { id: articleId } })
    if (!article) {
      return NextResponse.json({ error: 'مطلب یافت نشد' }, { status: 404 })
    }

    // Basic spam detection
    const spamPatterns = [
      /(https?:\/\/[^\s]+)/gi, // URLs (require moderation)
      /(viagra|casino|porn|sex|loan)/i, // common spam keywords
    ]
    const isSpam = spamPatterns.some((p) => p.test(content))
    if (isSpam) {
      return NextResponse.json({ error: 'نظر شما به عنوان اسپم شناسایی شد' }, { status: 400 })
    }

    const name = session?.user.name ?? authorName ?? 'مهمان'
    const email = session?.user.email ?? authorEmail ?? 'guest@example.com'

    const comment = await db.comment.create({
      data: {
        articleId,
        content,
        authorName: name,
        authorEmail: email,
        userId: session?.user.id ?? null,
        authorIp: ip,
        // Auto-approve if logged in, otherwise require moderation
        isApproved: !!session,
      },
    })

    const res = NextResponse.json({ comment })
    setRateLimitHeaders(res, rateLimit)
    return res
  } catch (e) {
    console.error('Comment error:', e)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
