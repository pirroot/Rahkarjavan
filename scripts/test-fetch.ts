// Test what fetchPage actually returns for fars
import { fetchPage } from '../src/lib/aggregator/fetchPage.ts'
import { getAggregatorSettings } from '../src/lib/aggregator/types.ts'

const settings = await getAggregatorSettings()
console.log('User-Agent:', settings.userAgent)

const url = 'https://farsnews.ir/politics/1795534693075596390'
try {
  const res = await fetchPage(url, settings, { respectRobots: true })
  console.log(`status: ${res.status} ok: ${res.ok} contentType: ${res.contentType}`)
  console.log(`html length: ${res.html.length}`)
  console.log(`finalUrl: ${res.finalUrl}`)
  console.log('\n=== first 1500 chars of HTML ===')
  console.log(res.html.slice(0, 1500))
  console.log('\n=== look for og:title / og:description ===')
  const ogTitle = res.html.match(/<meta[^>]*og:title[^>]*content="([^"]*)"/i)
  const ogDesc = res.html.match(/<meta[^>]*og:description[^>]*content="([^"]*)"/i)
  const ogImg = res.html.match(/<meta[^>]*og:image[^>]*content="([^"]*)"/i)
  console.log('og:title:', ogTitle?.[1]?.slice(0,80) || '(none)')
  console.log('og:description:', ogDesc?.[1]?.slice(0,200) || '(none)')
  console.log('og:image:', ogImg?.[1] || '(none)')
} catch (e) {
  console.log('EXCEPTION:', e?.message)
}
