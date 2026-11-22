import { ACCESS_COOKIE } from '../utils/accessCode'

export default defineEventHandler((event) => {
  deleteCookie(event, ACCESS_COOKIE, { path: '/' })
  return { role: null }
})