// Debug extract step-by-step
import { fetchPage } from '../src/lib/aggregator/fetchPage.ts'
import { getAggregatorSettings } from '../src/lib/aggregator/types.ts'
import * as cheerio from 'cheerio'
import { Readability } from '@mozilla/readability'
import { JSDOM } from 'jsdom'

const settings = await getAggregatorSettings()
const url = 'https://farsnews.ir/politics/1795534693075596390'
const res = await fetchPage(url, settings, { respectRobots: true })

const $ = cheerio.load(res.html)
// (don't pre-strip meta anymore — the fix removed it from the strip list)

// Title
const ogTitleMeta = $('meta[property="og:title"]').attr('content') || ''
const ogTitleClean = cleanText(ogTitleMeta)
const h1 = cleanText($('h1').first().text())
const titleTag = cleanText($('title').text())
console.log(`og:title raw: "${ogTitleMeta}"`)
console.log(`og:title clean: "${ogTitleClean}" (len=${ogTitleClean.length})`)
console.log(`h1: "${h1}" (len=${h1.length})`)
console.log(`<title>: "${titleTag}" (len=${titleTag.length})`)

// Body via Readability
const dom = new JSDOM(res.html, { url })
const reader = new Readability(dom.window.document, { charThreshold: 200 })
const article = reader.parse()
console.log(`\nReadability parsed: ${article ? 'yes' : 'no'}`)
if (article) {
  console.log(`  article.title: "${article.title?.slice(0,60)}" (len=${article.title?.length||0})`)
  console.log(`  article.textContent length: ${article.textContent?.length || 0}`)
  console.log(`  article.content length: ${article.content?.length || 0}`)
}

// og:description fallback
const ogDescRaw = $('meta[property="og:description"]').attr('content') || ''
const ogDesc = cleanText(ogDescRaw)
const metaDesc = cleanText($('meta[name="description"]').attr('content') || '')
console.log(`\nog:description raw: "${ogDescRaw}"`)
console.log(`og:description clean: "${ogDesc}" (len=${ogDesc.length})`)
console.log(`meta description: "${metaDesc}" (len=${metaDesc.length})`)

// What would happen?
const bodyFromOg = ogDesc.length >= 80 ? ogDesc : ''
const title = ogTitleClean || h1 || titleTag
console.log(`\n=== Decision ===`)
console.log(`title would be: "${title}" (len=${title.length})`)
console.log(`rawText would be: "${bodyFromOg}" (len=${bodyFromOg.length})`)
console.log(`rawText >= 80? ${bodyFromOg.length >= 80}`)
console.log(`title not empty? ${title.length > 0}`)
console.log(`=> extract returns: ${bodyFromOg.length >= 80 && title.length > 0 ? 'ARTICLE' : 'NULL'}`)

function cleanText(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}
