import { db } from '../src/lib/db'

async function main() {
  const total = await db.article.count()
  const published = await db.article.count({ where: { isPublished: true } })
  const drafts = await db.article.count({ where: { isPublished: false } })
  const auto = await db.article.count({ where: { isAutoImported: true } })
  const autoPub = await db.article.count({ where: { isAutoImported: true, isPublished: true } })
  const autoDraft = await db.article.count({ where: { isAutoImported: true, isPublished: false } })
  const noSourceUrl = await db.article.count({ where: { sourceUrl: null } })
  const sources = await db.newsSource.count()
  const activeSources = await db.newsSource.count({ where: { isActive: true } })
  const videos = await db.video.count()
  const publishedVideos = await db.video.count({ where: { isPublished: true } })
  const cats = await db.category.count()
  const users = await db.user.count()
  const subs = await db.newsletterSubscriber.count()
  const media = await db.media.count()

  console.log('Articles:', { total, published, drafts, noSourceUrl })
  console.log('Auto-imported:', { auto, autoPub, autoDraft, unpublished: auto - autoPub })
  console.log('NewsSources:', { sources, active: activeSources })
  console.log('Videos:', { videos, publishedVideos })
  console.log('Categories:', cats, 'Users:', users, 'Subs:', subs, 'Media:', media)

  const sample = await db.article.findMany({
    where: { isAutoImported: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, title: true, isPublished: true, status: true, sourceName: true, coverImage: true, sourceUrl: true, publishedAt: true, createdAt: true }
  })
  console.log('\n--- recent auto-imported samples ---')
  for (const a of sample) console.log(JSON.stringify(a, null, 2))

  const logs = await db.crawlLog.findMany({
    orderBy: { startedAt: 'desc' },
    take: 5,
    select: { sourceId: true, startedAt: true, finishedAt: true, status: true, found: true, created: true, published: true, skipped: true, failed: true, errors: true }
  })
  console.log('\n--- latest crawl logs ---')
  for (const l of logs) console.log(JSON.stringify(l))

  const settings = await db.siteSetting.findMany({ where: { key: { startsWith: 'agg_' } } })
  console.log('\n--- aggregator settings ---')
  for (const s of settings) console.log(s.key, '=', s.value)

  const srcs = await db.newsSource.findMany({ select: { id: true, name: true, isActive: true, lastRunAt: true, lastStatus: true, lastError: true, consecutiveFailures: true, autoDisabledAt: true, listingUrl: true, rssUrl: true, useSitemap: true, autoPublish: true, defaultCategoryId: true } })
  console.log('\n--- sources ---')
  for (const s of srcs) console.log(JSON.stringify(s, null, 2))
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
