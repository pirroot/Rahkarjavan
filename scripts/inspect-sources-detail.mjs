// Detailed source inspection — focus on why articles are skipped, not created
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const src = await db.newsSource.findMany({
  select: { id: true, name: true, rssUrl: true, listingUrl: true, lastRunAt: true, lastStatus: true, lastError: true, intervalMinutes: true, maxItemsPerRun: true, isActive: true, autoPublish: true, defaultCategoryId: true, consecutiveFailures: true }
})
for (const s of src) {
  console.log(`\n--- ${s.name} ---`)
  console.log(`  rssUrl:        ${s.rssUrl || '(none)'}`)
  console.log(`  listingUrl:    ${s.listingUrl || '(none)'}`)
  console.log(`  isActive:      ${s.isActive}`)
  console.log(`  autoPublish:   ${s.autoPublish}`)
  console.log(`  defaultCatId:  ${s.defaultCategoryId || '(none — بدون دسته‌بندی!)'}`)
  console.log(`  lastRunAt:     ${s.lastRunAt?.toISOString() || 'never'}`)
  console.log(`  lastStatus:    ${s.lastStatus}`)
  console.log(`  lastError:     ${s.lastError || '(none)'}`)
  console.log(`  interval:      ${s.intervalMinutes} min`)
  console.log(`  maxItems/run:  ${s.maxItemsPerRun}`)
  console.log(`  failures:      ${s.consecutiveFailures}`)
}

console.log('\n=== Total articles in DB ===')
console.log(await db.article.count())

console.log('\n=== Last 3 crawl logs with errors detail ===')
const logs = await db.crawlLog.findMany({
  orderBy: { startedAt: 'desc' },
  take: 3,
  select: { id: true, sourceId: true, startedAt: true, status: true, found: true, created: true, skipped: true, failed: true, published: true, errors: true }
})
for (const l of logs) {
  console.log(`\n  ${l.startedAt.toISOString()} src=${l.sourceId.slice(0,8)} ${l.status}`)
  console.log(`    found=${l.found} created=${l.created} skipped=${l.skipped} failed=${l.failed} published=${l.published}`)
  if (l.errors && l.errors.length > 0) {
    console.log(`    errors:`)
    for (const e of l.errors) console.log(`      - url=${e.url || '(none)'} :: ${e.error}`)
  } else {
    console.log(`    errors: []  (skips with no error = dedup, not a failure)`)
  }
}

await db.$disconnect()
