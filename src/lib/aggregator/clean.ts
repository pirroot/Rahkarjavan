// clean.ts — sanitize HTML and remove junk lines from article content
// پایگاه خبری راهکار جوان

import sanitizeHtml from 'sanitize-html'
import * as cheerio from 'cheerio'

const ALLOWED_TAGS = [
  'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
  'a', 'img', 'figure', 'figcaption', 'picture', 'source',
  'strong', 'em', 'b', 'i', 'u', 's', 'del', 'ins', 'sub', 'sup',
  'span', 'div', 'section', 'article',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
]

const ALLOWED_ATTRS: sanitizeHtml.Attributes = {
  '*': ['class', 'id', 'style', 'dir', 'lang'],
  'a': ['href', 'title', 'target', 'rel'],
  'img': ['src', 'alt', 'title', 'width', 'height', 'loading'],
  'source': ['src', 'srcset', 'media', 'type'],
}

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: ALLOWED_ATTRS,
  allowedSchemes: ['http', 'https', 'data', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  // force rel="noopener noreferrer" on external links, open new tab
  transformTags: {
    'a': (name, attribs) => {
      if (attribs.href && !isInternalHref(attribs.href)) {
        return { tagName: name, attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer nofollow' } }
      }
      return { tagName: name, attribs }
    },
  },
  // strip all class noise except those we need for visual styling
  allowedClasses: { '*': [] },
  // don't auto-add target on internal links
}

export interface CleanOptions {
  // regex patterns (strings) to drop matching lines from text content
  junkPatterns: string[]
  // remove links back to source domain
  sourceHost?: string
}

/** Sanitize raw HTML, drop junk, drop links back to source host. */
export function cleanHtml(html: string, opts: CleanOptions): string {
  let safe = sanitizeHtml(html, SANITIZE_OPTIONS)

  // post-process with cheerio to drop paragraphs that match junk patterns
  const $ = cheerio.load(safe)

  // drop links whose href points to source host (internal links)
  if (opts.sourceHost) {
    $('a').each((_, el) => {
      const href = $(el).attr('href') || ''
      try {
        const u = new URL(href)
        if (u.hostname === opts.sourceHost || u.hostname.endsWith('.' + opts.sourceHost)) {
          // unwrap: replace <a> with its text
          $(el).replaceWith($(el).text())
        }
      } catch { /* ignore invalid */ }
    })
  }

  // apply junk-line patterns on paragraph text nodes
  if (opts.junkPatterns.length) {
    const compiled = opts.junkPatterns.map((p) => {
      try { return new RegExp(p, 'g') } catch { return null }
    }).filter(Boolean) as RegExp[]

    $('p, li, h1, h2, h3, h4, h5, h6, figcaption, blockquote, div').each((_, el) => {
      const $el = $(el)
      // only consider leaf-level elements (no block children)
      if ($el.children('p, div, ul, ol, table').length > 0) return
      let text = $el.text()
      if (!text.trim()) return
      let original = text
      for (const re of compiled) {
        text = text.replace(re, '')
      }
      if (text.trim() === '' || text !== original) {
        if (text.trim() === '') {
          $el.remove()
        } else {
          $el.text(text.trim())
        }
      }
    })
  }

  // remove empty wrappers / collapsing whitespace
  $('p, div, span').each((_, el) => {
    const $el = $(el)
    if (!$el.text().trim() && !$el.find('img, figure, table, ul, ol').length) {
      $el.remove()
    }
  })

  return $.html()
}

function isInternalHref(href: string): boolean {
  return href.startsWith('#') || href.startsWith('/') || href.startsWith('./')
}

/** Pull the host out of an article URL (used to scrub internal links from copied content). */
export function urlHost(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return undefined
  }
}

/** Strip whitespace-only paragraphs and normalize spacing. */
export function normalizeHtml(html: string): string {
  return html.replace(/\n{3,}/g, '\n\n').replace(/\s+/g, ' ').trim()
}
