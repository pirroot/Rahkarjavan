// replace.ts — apply "find → replace" rules to rebrand content
// پایگاه خبری راهکار جوان

import * as cheerio from 'cheerio'
import { db } from '@/lib/db'

export interface ReplaceRuleRow {
  find: string
  replaceWith: string
  isRegex: boolean
  caseSensitive: boolean
}

/**
 * Load all replace rules for a source. Order: global first, source-specific after.
 * Within each group, higher `order` runs first so longer/specific patterns beat
 * shorter substrings.
 */
export async function loadReplaceRules(sourceId: string): Promise<ReplaceRuleRow[]> {
  const rows = await db.replaceRule.findMany({
    where: {
      isActive: true,
      OR: [{ sourceId }, { sourceId: null }],
    },
    orderBy: [{ sourceId: 'desc' }, { order: 'desc' }, { createdAt: 'asc' }],
  })
  return rows.map((r) => ({
    find: r.find,
    replaceWith: r.replaceWith,
    isRegex: r.isRegex,
    caseSensitive: r.caseSensitive,
  }))
}

/** Apply replace rules to a plain string. Longer `find` patterns first (length fallback). */
export function applyRulesToString(input: string, rules: ReplaceRuleRow[]): string {
  // sort by length desc so longer patterns win, unless regex
  const sorted = [...rules].sort((a, b) => {
    if (a.isRegex !== b.isRegex) return a.isRegex ? 1 : -1
    return b.find.length - a.find.length
  })
  let out = input
  for (const r of sorted) {
    if (!r.find) continue
    if (r.isRegex) {
      try {
        const flags = r.caseSensitive ? 'g' : 'gi'
        out = out.replace(new RegExp(r.find, flags), r.replaceWith)
      } catch {
        // invalid regex, skip
      }
    } else {
      if (r.caseSensitive) {
        out = out.split(r.find).join(r.replaceWith)
      } else {
        const re = new RegExp(escapeRegex(r.find), 'gi')
        out = out.replace(re, r.replaceWith)
      }
    }
  }
  // collapse duplicates like "X، X" / "X X" that replacements can create
  out = out.replace(/([^\s،,.!?؛:»]+)\s*،\s*\1\s*،/g, '$1،')
  out = out.replace(/\b(\S+)\s+\1\b/g, '$1')
  return out
}

/** Apply replace rules across title, excerpt, content HTML and image alt text. */
export function applyRulesToArticle(
  article: { title: string; excerpt: string; contentHtml: string; coverImageAlt?: string },
  rules: ReplaceRuleRow[],
): { title: string; excerpt: string; contentHtml: string } {
  const title = applyRulesToString(article.title, rules)
  const excerpt = applyRulesToString(article.excerpt, rules)

  // For HTML content, run rules on text nodes only (not on tag/attr markup),
  // and on `alt` attributes of images.
  const $ = cheerio.load(article.contentHtml)
  const textNodes: string[] = []
  $('body *').contents().each((_, node) => {
    if (node.type === 'text') {
      const t = $(node).text()
      if (t.trim()) textNodes.push(t)
    }
  })
  $('img').each((_, el) => {
    const alt = $(el).attr('alt')
    if (alt) {
      $(el).attr('alt', applyRulesToString(alt, rules))
    }
  })
  // replace each text node individually
  let textIdx = 0
  $('body *').contents().each((_, node) => {
    if (node.type === 'text') {
      const original = $(node).text()
      if (!original.trim()) return
      const replaced = applyRulesToString(original, rules)
      if (replaced !== original) {
        $(node).replaceWith(replaced)
      }
      textIdx++
    }
  })
  return { title, excerpt, contentHtml: $.html() }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Preview: apply rules to a sample string and return the diff. */
export function previewRules(input: string, rules: ReplaceRuleRow[]): string {
  return applyRulesToString(input, rules)
}
