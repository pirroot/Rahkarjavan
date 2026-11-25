import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
const result = await db.newsSource.updateMany({
  where: { name: { contains: 'فارس' } },
  data: { lastRunAt: null, consecutiveFailures: 0, lastError: null, lastStatus: null }
})
console.log(`Reset ${result.count} fars sources (lastRunAt=null)`)
await db.$disconnect()
