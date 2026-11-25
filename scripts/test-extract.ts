import { extractArticle } from '../src/lib/aggregator/extract.ts'
import { getAggregatorSettings } from '../src/lib/aggregator/types.ts'
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
const source = await db.newsSource.findFirst({ where: { name: { contains: 'فارس — سیاسی' } } })
const settings = await getAggregatorSettings()
console.log('respectRobots:', source.respectRobots)
console.log('titleSelector:', source.titleSelector)
console.log('bodySelector:', source.bodySelector)
console.log('imageSelector:', source.imageSelector)
console.log('removeSelectors:', source.removeSelectors)
const result = await extractArticle('https://farsnews.ir/politics/1795534693075596390', {
  titleSelector: source.titleSelector,
  bodySelector: source.bodySelector,
  imageSelector: source.imageSelector,
  dateSelector: source.dateSelector,
  categorySelector: source.categorySelector,
  removeSelectors: JSON.parse(source.removeSelectors || '[]'),
}, settings, source.respectRobots)
console.log('extract result:', result ? `title="${result.title?.slice(0,50)}" contentLen=${result.contentHtml.length}` : 'NULL')
if (result) console.log('excerpt:', result.excerpt?.slice(0,100))
await db.$disconnect()
