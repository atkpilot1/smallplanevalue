import { ACCESS_COOKIE, openAccessToken } from '../utils/accessCode'

export default defineEventHandler((event) => {
  const role = openAccessToken(getCookie(event, ACCESS_COOKIE))
  return { role }
})
