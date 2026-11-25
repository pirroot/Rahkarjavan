// Direct test: discover + extract + publish from fars — print every step + error
import { PrismaClient } from '@prisma/client'
import { discoverArticles } from '../src/lib/aggregator/discover.ts'
import { extractArticle } from '../src/lib/aggregator/extract.ts'
import { publishArticle } from '../src/lib/aggregator/publish.ts'
import { getAggregatorSettings, normalizeUrl, titleHash } from '../src/lib/aggregator/types.ts'

const db = new PrismaClient()

const source = await db.newsSource.findFirst({ where: { name: { contains: 'فارس — سیاسی' } } })
if (!source) { console.log('source not found'); process.exit(1) }

console.log(`Source: ${source.name}`)
console.log(`rssUrl: ${source.rssUrl}`)
console.log(`lastRunAt: ${source.lastRunAt?.toISOString() || 'null'}`)

const settings = await getAggregatorSettings()
console.log(`Settings: latestOnly=${settings.latestOnly} importImages=${settings.importImages} minContent=${settings.minContentLength}`)

// Force latestOnly=false for this test, so we can see all items
const testSettings = { ...settings, latestOnly: false }

console.log(`\n=== Discovering (latestOnly=false) ===`)
const items = await discoverArticles(
  { rssUrl: source.rssUrl, listingUrl: source.listingUrl, linkSelector: source.linkSelector, useSitemap: source.useSitemap, baseUrl: 'https://farsnews.ir' },
  testSettings,
  5,
  source.respectRobots
)
console.log(`Found ${items.length} items`)
for (const it of items.slice(0, 3)) {
  console.log(`  - ${it.title?.slice(0,60)} | pub=${it.publishedAt?.toISOString()} | url=${it.url}`)
}

if (items.length === 0) {
  console.log('\nNo items discovered — RSS may be dead or sitemap empty')
  await db.$disconnect()
  process.exit(0)
}

console.log(`\n=== Processing first 3 items ===`)
for (const item of items.slice(0, 3)) {
  const normalizedUrl = normalizeUrl(item.url)
  console.log(`\n--- ${item.title?.slice(0,50)} ---`)
  console.log(`url: ${normalizedUrl}`)

  const existing = await db.article.findFirst({ where: { sourceUrl: normalizedUrl }, select: { id: true } })
  if (existing) { console.log('  SKIP: already imported (sourceUrl dedup)'); continue }

  try {
    const extracted = await extractArticle(item.url, {
      titleSelector: source.titleSelector,
      bodySelector: source.bodySelector,
      imageSelector: source.imageSelector,
      dateSelector: source.dateSelector,
      categorySelector: source.categorySelector,
      removeSelectors: JSON.parse(source.removeSelectors || '[]'),
    }, testSettings, source.respectRobots)

    if (!extracted) { console.log('  SKIP: extract returned null (page unreachable or empty)'); continue }
    console.log(`  extracted: title="${extracted.title?.slice(0,40)}" contentLen=${extracted.contentHtml.length} isOgFallback=${extracted.isOgFallback}`)
    const tooShort = !extracted.isOgFallback
      ? extracted.contentHtml.length < testSettings.minContentLength
      : extracted.contentHtml.length < 80
    console.log(`  contentLen < minContent(${testSettings.minContentLength})? ${tooShort} (isOgFallback=${extracted.isOgFallback})`)
    if (!extracted.title || tooShort) {
      console.log('  SKIP: too short or no title')
      continue
    }

    const hash = titleHash(extracted.title)
    const dupHash = await db.article.findFirst({ where: { titleHash: hash, isAutoImported: true }, select: { id: true } })
    if (dupHash) { console.log('  SKIP: title hash already imported'); continue }

    const result = await publishArticle({
      source: { id: source.id, name: source.name, autoPublish: source.autoPublish, autoPublishVideo: source.autoPublishVideo, useOriginalDate: source.useOriginalDate, addSourceCredit: source.addSourceCredit, defaultCategoryId: source.defaultCategoryId, videoCategoryId: source.videoCategoryId, categoryMap: source.categoryMap },
      article: { ...extracted, title: extracted.title, excerpt: extracted.excerpt || '', contentHtml: extracted.contentHtml },
      coverImage: undefined,
    }, testSettings)

    console.log(`  PUBLISH RESULT: ok=${result.ok} kind=${result.kind} published=${result.published} error=${result.error || '-'}`)
  } catch (e) {
    console.log(`  EXCEPTION: ${e?.message}`)
    console.log(`  stack: ${e?.stack?.split('\n').slice(0,3).join(' | ')}`)
  }
}

console.log(`\n=== Total articles now: ${await db.article.count()} ===`)
await db.$disconnect()
