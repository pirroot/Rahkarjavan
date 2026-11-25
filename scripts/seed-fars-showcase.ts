// seed-fars-showcase.ts — create Fars News sources for the 4 categories the
// project owner asked for (politics, economy, sport, youth).
//
// The project owner named these "showcase" URLs:
//   https://farsnews.ir/politics/showcase
//   https://farsnews.ir/economic/showcase
//   https://farsnews.ir/sport/showcase
//   https://farsnews.ir/Nojavan/showcase
//
// Reality check: those showcase pages are pure SPAs that return ~3.9KB of
// shell HTML with NO server-rendered article links (no `__NEXT_DATA__`, no
// JSON-LD, no `<a href>`). The article list is fetched at runtime from their
// internal API (a.next-portal.com), which is undocumented and would break
// without warning. So we cannot scrape the showcase HTML directly.
//
// What DOES work: Fars publishes dated sitemaps at
//   https://farsnews.ir/sitemaps/contents/index2026.xml
// which contain per-day child sitemaps, and every article URL there uses a
// predictable per-category path prefix:
//   /politics/<id>/<slug>     → سیاسی
//   /economic/<id>/<slug>     → اقتصادی
//   /sport/<id>/<slug>        → ورزش
//   /Nojavan/<id>/<slug>      → نوجوان
//
// We point each source at the sitemap index and use the `linkSelector` field
// as a "path filter" (the aggregator's `discoverFromSitemapUrl` reads it and
// keeps only URLs whose path contains the filter substring). This imports
// the same content the showcase page shows, but through a stable, public,
// robots-friendly sitemap.
//
// Run: bunx tsx scripts/seed-fars-showcase.ts

import { db } from '../src/lib/db'

interface ShowcaseSeed {
  name: string
  sitemapUrl: string
  pathFilter: string
  categorySlug: string
  fallbackColor: string
}

const SITEMAP_INDEX = 'https://farsnews.ir/sitemaps/contents/index2026.xml'

const SEEDS: ShowcaseSeed[] = [
  { name: 'خبرگزاری فارس — سیاسی',  sitemapUrl: SITEMAP_INDEX, pathFilter: '/politics/', categorySlug: 'politics',  fallbackColor: '#dc2626' },
  { name: 'خبرگزاری فارس — اقتصادی', sitemapUrl: SITEMAP_INDEX, pathFilter: '/economic/', categorySlug: 'economy',   fallbackColor: '#059669' },
  { name: 'خبرگزاری فارس — ورزش',   sitemapUrl: SITEMAP_INDEX, pathFilter: '/sport/',    categorySlug: 'sport',     fallbackColor: '#2563eb' },
  { name: 'خبرگزاری فارس — نوجوان', sitemapUrl: SITEMAP_INDEX, pathFilter: '/Nojavan/',  categorySlug: 'nojavan',   fallbackColor: '#9333ea' },
]

async function main() {
  // Ensure the 4 categories exist (create if missing).
  for (const seed of SEEDS) {
    const existing = await db.category.findUnique({ where: { slug: seed.categorySlug } })
    if (!existing) {
      await db.category.create({
        data: {
          name: nameFor(seed.categorySlug),
          slug: seed.categorySlug,
          color: seed.fallbackColor,
          type: 'ARTICLE',
        },
      })
      console.log(`+ category created: ${seed.categorySlug}`)
    }
  }

  // Create or update the 4 showcase sources.
  for (const seed of SEEDS) {
    const cat = await db.category.findUnique({ where: { slug: seed.categorySlug } })
    if (!cat) continue
    const existing = await db.newsSource.findFirst({ where: { name: seed.name } })
    const data = {
      name: seed.name,
      isActive: true,
      rssUrl: seed.sitemapUrl,     // discover.ts detects `.xml`/`sitemap` and treats it as a sitemap
      // linkSelector doubles as a "path filter" for sitemap discovery: only
      // URLs whose path contains this substring are kept. This is how we get
      // per-category imports from one shared sitemap index.
      linkSelector: seed.pathFilter,
      listingUrl: null,
      useSitemap: false,
      autoPublish: true,
      addSourceCredit: true,        // append "منبع: خبرگزاری فارس"
      defaultCategoryId: cat.id,
      maxItemsPerRun: 15,
      intervalMinutes: 20,
      respectRobots: true,
    }
    if (existing) {
      await db.newsSource.update({ where: { id: existing.id }, data })
      console.log(`~ source updated: ${seed.name} (filter=${seed.pathFilter})`)
    } else {
      await db.newsSource.create({ data })
      console.log(`+ source created: ${seed.name} (filter=${seed.pathFilter})`)
    }
  }
  console.log('\n✅ Fars showcase seeding complete.')
  console.log('   (Showcase HTML is SPA-only; using dated sitemap with path filter instead.)')
}

function nameFor(slug: string): string {
  switch (slug) {
    case 'politics': return 'سیاسی'
    case 'economy': return 'اقتصادی'
    case 'sport': return 'ورزش'
    case 'nojavan': return 'نوجوان'
    default: return slug
  }
}

main()
  .catch((e) => { console.error('seed error:', e); process.exit(1) })
  .finally(() => db.$disconnect())
