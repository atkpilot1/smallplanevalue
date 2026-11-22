import { ACCESS_COOKIE, openAccessToken, type AccessRole } from './accessCode'

export function readAccessGrant(event: Parameters<typeof getCookie>[0]): AccessRole | null {
  return openAccessToken(getCookie(event, ACCESS_COOKIE))
}
