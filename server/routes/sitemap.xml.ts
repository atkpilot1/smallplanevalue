import { AIRCRAFT_GUIDES } from '~/data/aircraftGuides'
import { absoluteUrl } from '~/utils/site'

export default defineEventHandler((event) => {
  const paths = ['/', '/aircraft', ...AIRCRAFT_GUIDES.map((guide) => `/aircraft/${guide.slug}`)]
  const urls = paths.map((path) => `  <url><loc>${absoluteUrl(path)}</loc></url>`).join('\n')
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
})
