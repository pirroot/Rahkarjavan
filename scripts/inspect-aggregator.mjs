// Inspect aggregator DB state — uses node + tsx-style import via @prisma/client
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

console.log('=== NewsSource ===')
const sources = await db.newsSource.findMany({
  select: { id: true, name: true, isActive: true, rssUrl: true, listingUrl: true, intervalMinutes: true, lastRunAt: true, autoDisabledAt: true, consecutiveFailures: true, lastStatus: true, lastError: true },
  orderBy: { createdAt: 'asc' },
  take: 50,
})
console.table(sources.map(s => ({
  id: s.id.slice(0,8),
  name: s.name,
  active: s.isActive,
  hasRss: !!s.rssUrl,
  hasListing: !!s.listingUrl,
  interval: s.intervalMinutes,
  lastRun: s.lastRunAt ? s.lastRunAt.toISOString() : 'never',
  autoDisabledAt: s.autoDisabledAt ? s.autoDisabledAt.toISOString() : '-',
  fails: s.consecutiveFailures,
  lastStatus: s.lastStatus,
  lastError: s.lastError ? s.lastError.slice(0,60) : '-',
})))

console.log('\n=== Counts ===')
const [totalArticles, autoArticles, publishedAuto, draftAuto, totalLogs] = await Promise.all([
  db.article.count(),
  db.article.count({ where: { isAutoImported: true } }),
  db.article.count({ where: { isAutoImported: true, isPublished: true } }),
  db.article.count({ where: { isAutoImported: true, isPublished: false } }),
  db.crawlLog.count(),
])
console.log('Total articles:', totalArticles)
console.log('Auto-imported articles:', autoArticles)
console.log('  - published:', publishedAuto)
console.log('  - draft:', draftAuto)
console.log('Crawl logs total:', totalLogs)

console.log('\n=== Last 8 crawl logs ===')
const logs = await db.crawlLog.findMany({
  orderBy: { startedAt: 'desc' },
  take: 8,
  select: { id: true, sourceId: true, startedAt: true, status: true, found: true, created: true, published: true, skipped: true, failed: true, errors: true, durationMs: true },
})
for (const l of logs) {
  console.log(`- ${l.startedAt.toISOString()} src=${l.sourceId.slice(0,8)} ${l.status} found=${l.found} created=${l.created} published=${l.published} skip=${l.skipped} fail=${l.failed} dur=${l.durationMs}ms`)
  if (l.errors) console.log(`    errors: ${JSON.stringify(l.errors).slice(0,300)}`)
}

console.log('\n=== Aggregator settings (SiteSetting aggregator.*) ===')
const settings = await db.siteSetting.findMany({ where: { key: { startsWith: 'aggregator.' } } })
for (const s of settings) console.log(`- ${s.key} = ${s.value}`)

console.log('\n=== Sample auto articles (last 3) ===')
const arts = await db.article.findMany({ where: { isAutoImported: true }, orderBy: { createdAt: 'desc' }, take: 3, select: { id: true, title: true, isPublished: true, status: true, sourceId: true, createdAt: true, publishedAt: true } })
for (const a of arts) console.log(`- [${a.status}] "${a.title?.slice(0,60)}" pub=${a.isPublished} createdAt=${a.createdAt.toISOString()}`)

await db.$disconnect()
