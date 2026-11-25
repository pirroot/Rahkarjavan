#!/usr/bin/env bash
# Inspect the aggregator DB state using bun (prisma client)
set -e
cd /home/z/my-project

cat > /tmp/inspect.mjs <<'EOF'
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

console.log('=== NewsSource ===')
const sources = await db.newsSource.findMany({
  select: { id: true, name: true, isActive: true, rssUrl: true, listingUrl: true, intervalMinutes: true, lastRunAt: true, autoDisabledAt: true, consecutiveErrors: true },
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
  errors: s.consecutiveErrors,
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

console.log('\n=== Last 5 crawl logs ===')
const logs = await db.crawlLog.findMany({
  orderBy: { startedAt: 'desc' },
  take: 5,
  select: { id: true, sourceId: true, startedAt: true, status: true, itemsFound: true, itemsImported: true, error: true },
})
for (const l of logs) {
  console.log(`- ${l.startedAt.toISOString()} src=${l.sourceId.slice(0,8)} status=${l.status} found=${l.itemsFound} imported=${l.itemsImported} err=${(l.error||'').slice(0,200)}`)
}

console.log('\n=== Aggregator settings (SiteSetting aggregator.*) ===')
const settings = await db.siteSetting.findMany({ where: { key: { startsWith: 'aggregator.' } } })
for (const s of settings) console.log(`- ${s.key} = ${s.value}`)

await db.$disconnect()
EOF

bun /tmp/inspect.mjs 2>&1 | head -80