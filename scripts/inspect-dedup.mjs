// Check dedup logic + recent articles + aggregator settings
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

console.log('=== Aggregator settings ===')
const settings = await db.siteSetting.findMany({ where: { key: { startsWith: 'aggregator.' } } })
for (const s of settings) console.log(`- ${s.key} = ${s.value}`)

console.log('\n=== Duplicate check: count articles by titleHash ===')
const dups = await db.article.groupBy({
  by: ['titleHash'],
  where: { isAutoImported: true, titleHash: { not: null } },
  _count: true,
  having: { _count: { titleHash: { gt: 1 } } },
  take: 10,
})
console.log('titleHash groups with >1 article:', dups.length)
for (const d of dups.slice(0,5)) {
  console.log(`- hash=${d.titleHash?.slice(0,16)} count=${d._count.titleHash}`)
  const arts = await db.article.findMany({ where: { titleHash: d.titleHash }, select: { id: true, title: true, createdAt: true, sourceId: true } })
  for (const a of arts) console.log(`    "${a.title?.slice(0,50)}" src=${a.sourceId?.slice(0,8)} at=${a.createdAt.toISOString()}`)
}

console.log('\n=== Articles created in last 5 minutes (the ones just made) ===')
const recent = await db.article.findMany({
  where: { createdAt: { gte: new Date(Date.now() - 5*60*1000) } },
  select: { id: true, title: true, sourceId: true, titleHash: true, createdAt: true },
  orderBy: { createdAt: 'desc' },
  take: 10,
})
console.log('recent articles:', recent.length)
for (const a of recent) console.log(`- hash=${a.titleHash?.slice(0,12) || 'NULL'} src=${a.sourceId?.slice(0,8) || 'MANUAL'} "${a.title?.slice(0,50)}"`)

console.log('\n=== Total auto articles now ===')
const total = await db.article.count({ where: { isAutoImported: true } })
console.log('auto articles total:', total)

await db.$disconnect()
