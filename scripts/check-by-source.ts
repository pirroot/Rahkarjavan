// Check which sources actually created articles (manual count per source)
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const sources = await db.newsSource.findMany({ select: { id: true, name: true, rssUrl: true, listingUrl: true } })
console.log('Articles created per source:')
for (const s of sources) {
  const count = await db.article.count({ where: { sourceId: s.id, isAutoImported: true } })
  console.log(`  ${count.toString().padStart(3)} articles  ←  ${s.name}  (rss=${!!s.rssUrl}, listing=${!!s.listingUrl})`)
}
await db.$disconnect()
