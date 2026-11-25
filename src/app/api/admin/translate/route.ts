// /api/admin/translate — translate an article's title/excerpt/content to English
// پایگاه خبری راهکار جوان
//
// Uses the z-ai-web-dev-sdk chat completions (GLM-4) as a translation engine.
// This is server-side only — the SDK must never be imported into client code.
//
// POST body: { id: string, targetLang: 'en' }
// Returns: { title: string, excerpt: string, content: string }

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import ZAI, { ChatMessage } from 'z-ai-web-dev-sdk'

async function requireEditor() {
  const session = await getSession()
  // The client asked for a "translate" button visible on the site for visitors.
  // We allow any logged-in user (USER / EDITOR / ADMIN) to translate an article;
  // the GLM call costs tokens, so we don't open it to anonymous visitors to
  // avoid abuse. Anonymous visitors can still SEE the English version once an
  // editor has generated it (it's cached on the article row).
  if (!session) return null
  return session
}

/** Strip HTML to plain text (for translation input — the LLM doesn't need markup). */
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/** Call the LLM to translate a Persian text to English.
 * Returns the translation, or null on failure. */
async function translateToEnglish(text: string): Promise<string | null> {
  if (!text || text.trim().length === 0) return ''
  // Cap input length to keep latency & token use sane (≈ 4000 chars ≈ ~1500 tokens).
  const capped = text.slice(0, 4000)
  try {
    const zai = await ZAI.create()
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are a professional news translator. Translate the user message from Persian (Farsi) to English. ' +
          'Output ONLY the translation, with no quotes, no preface, no commentary. ' +
          'Preserve the meaning, tone, and any proper nouns. Keep the paragraph breaks.',
      },
      { role: 'user', content: capped },
    ]
    const resp = await zai.chat.completions.create({
      messages,
      stream: false,
      thinking: { type: 'disabled' },
    })
    const out = resp.choices?.[0]?.message?.content
    return out ? out.trim() : null
  } catch (e: any) {
    console.error('translate error:', e?.message || e)
    return null
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireEditor())) {
    return NextResponse.json({ error: 'غیرمجاز' }, { status: 403 })
  }
  let body: any = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: 'ورودی نامعتبر' }, { status: 400 }) }
  const { id, targetLang } = body
  if (!id || targetLang !== 'en') {
    return NextResponse.json({ error: 'پارامتر نامعتبر' }, { status: 400 })
  }

  const article = await db.article.findUnique({
    where: { id },
    select: { id: true, title: true, excerpt: true, content: true },
  })
  if (!article) return NextResponse.json({ error: 'خبر یافت نشد' }, { status: 404 })

  // Run the three translations in parallel for speed.
  const [titleEn, excerptEn, contentEn] = await Promise.all([
    translateToEnglish(article.title),
    translateToEnglish(article.excerpt || ''),
    translateToEnglish(stripHtml(article.content)),
  ])

  if (titleEn === null) {
    return NextResponse.json({ error: 'ترجمه ناموفق بود (خدمت ترجمه در دسترس نیست)' }, { status: 502 })
  }

  // Persist the English version to the article (titleEn / excerptEn / contentEn columns).
  await db.article.update({
    where: { id },
    data: {
      titleEn,
      excerptEn: excerptEn || '',
      contentEn: contentEn ? `<p>${contentEn.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>')}</p>` : '',
    },
  })

  return NextResponse.json({
    id,
    titleEn,
    excerptEn: excerptEn || '',
    contentEn: contentEn || '',
  })
}

export const runtime = 'nodejs'
export const maxDuration = 120
