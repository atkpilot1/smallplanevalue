import { z } from 'zod'
import {
  ACCESS_COOKIE,
  ACCESS_COOKIE_MAX_AGE,
  accessCodesConfigured,
  roleForAccessCode,
  sealAccessToken,
} from '../utils/accessCode'

const bodySchema = z.object({
  code: z.string().trim().min(1).max(80),
})

const failures = new Map<string, { count: number; lockedUntil: number }>()
const LOCK_AFTER = 8
const LOCK_MS = 60_000

export default defineEventHandler(async (event) => {
  if (!accessCodesConfigured()) {
    throw createError({ statusCode: 503, statusMessage: 'Access codes are not set up yet.' })
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const now = Date.now()
  const prior = failures.get(ip)
  if (prior && prior.lockedUntil > now) {
    throw createError({ statusCode: 429, statusMessage: 'Too many tries. Wait a minute and try again.' })
  }

  const parsed = bodySchema.safeParse(await readBody(event))
  const role = parsed.success ? roleForAccessCode(parsed.data.code) : null
  if (!role) {
    const count = (prior && prior.lockedUntil <= now ? prior.count : 0) + 1
    failures.set(ip, { count, lockedUntil: count >= LOCK_AFTER ? now + LOCK_MS : 0 })
    throw createError({ statusCode: 401, statusMessage: 'That code is not valid.' })
  }

  failures.delete(ip)
  const token = sealAccessToken(role, now)
  if (!token) {
    throw createError({ statusCode: 503, statusMessage: 'Access codes are not set up yet.' })
  }
  setCookie(event, ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_COOKIE_MAX_AGE,
  })
  return { role }
})
