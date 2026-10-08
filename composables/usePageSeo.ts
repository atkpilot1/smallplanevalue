import { absoluteUrl } from '~/utils/site'

export function usePageSeo(opts: {
  title: string
  description: string
  path: string
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}) {
  const url = absoluteUrl(opts.path)
  useSeoMeta({
    title: opts.title,
    description: opts.description,
    ogTitle: opts.title,
    ogDescription: opts.description,
    ogUrl: url,
    ogType: 'website',
    twitterCard: 'summary',
  })
  const scripts = opts.jsonLd
    ? (Array.isArray(opts.jsonLd) ? opts.jsonLd : [opts.jsonLd]).map((data) => ({
        type: 'application/ld+json',
        innerHTML: JSON.stringify(data),
      }))
    : []
  useHead({
    link: [{ rel: 'canonical', href: url }],
    script: scripts,
  })
}
