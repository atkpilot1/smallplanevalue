export const SITE_ORIGIN = 'https://www.smallplanevalue.com'

export function absoluteUrl(path: string) {
  if (path === '/') return SITE_ORIGIN + '/'
  return SITE_ORIGIN + (path.startsWith('/') ? path : `/${path}`)
}
