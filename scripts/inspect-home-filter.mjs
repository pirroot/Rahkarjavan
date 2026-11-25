// Inspect: do published articles match the home-page filter?
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

console.log('=== All articles vs filter home-page uses ===')
const [all, pubOnly, pubAndStatus, autoPub] = await Promise.all([
  db.article.count(),
  db.article.count({ where: { isPublished: true } }),
  db.article.count({ where: { isPublished: true, status: 'PUBLISHED' } }),
  db.article.count({ where: { isAutoImported: true, isPublished: true } }),
])
console.log('Total articles:        ', all)
console.log('isPublished=true:      ', pubOnly)
console.log('isPublished+PUBLISHED: ', pubAndStatus, '  <- this is what the home page requires')
console.log('auto + published:      ', autoPub)

console.log('\n=== Status distribution (all articles) ===')
const statusGroups = await db.article.groupBy({ by: ['status'], _count: true })
console.table(statusGroups)

console.log('\n=== Status distribution (isPublished=true) ===')
const pubGroups = await db.article.groupBy({ by: ['status'], where: { isPublished: true }, _count: true })
console.table(pubGroups)

console.log('\n=== Auto-imported articles: status + publishedAt ===')
const sampleAuto = await db.article.findMany({
  where: { isAutoImported: true },
  take: 5,
  orderBy: { createdAt: 'desc' },
  select: { id: true, title: true, status: true, isPublished: true, publishedAt: true, isFeatured: true, categoryId: true },
})
for (const a of sampleAuto) {
  console.log(`- status=${a.status} pub=${a.isPublished} featured=${a.isFeatured} pubAt=${a.publishedAt?.toISOString()||'NULL'} cat=${a.categoryId||'NULL'} :: "${a.title?.slice(0,50)}"`)
}

console.log('\n=== /api/articles?sort=latest&limit=5 simulation ===')
const sim = await db.article.findMany({
  where: { isPublished: true, status: 'PUBLISHED' },
  orderBy: { publishedAt: 'desc' },
  take: 5,
  select: { id: true, title: true, publishedAt: true, status: true, isPublished: true },
})
console.log('returned', sim.length, 'articles')
for (const a of sim) console.log(`  - "${a.title?.slice(0,50)}" pubAt=${a.publishedAt?.toISOString()||'NULL'}`)

console.log('\n=== /api/articles?featured=true&limit=5 simulation ===')
const feat = await db.article.findMany({
  where: { isPublished: true, status: 'PUBLISHED', isFeatured: true },
  orderBy: { publishedAt: 'desc' },
  take: 5,
})
console.log('returned', feat.length, 'featured articles')

console.log('\n=== publishedAt NULL check (published but no date) ===')
const nullPubAt = await db.article.count({ where: { isPublished: true, status: 'PUBLISHED', publishedAt: null } })
console.log('published with NULL publishedAt:', nullPubAt)

await db.$disconnect()
