import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

export type AccessRole = 'owner' | 'beta'

const MAX_AGE_SEC = 60 * 60 * 24 * 30

export function accessCodesConfigured(): boolean {
  const { owner, beta } = configuredCodes()
  return owner.length > 0 && beta.length > 0
}

/** Owner and beta are different codes. A match is one role, never both. */
export function roleForAccessCode(code: string | null | undefined): AccessRole | null {
  const normalized = (code || '').trim()
  if (!normalized) return null
  const { owner, beta } = configuredCodes()
  if (owner && digestEqual(normalized, owner)) return 'owner'
  if (beta && digestEqual(normalized, beta)) return 'beta'
  return null
}

export function sealAccessToken(role: AccessRole, now = Date.now()): string | null {
  const key = keyFor(role)
  if (!key) return null
  const exp = Math.floor(now / 1000) + MAX_AGE_SEC
  const sig = sign(role, exp, key)
  return `${role}.${exp}.${sig}`
}

export function openAccessToken(token: string | null | undefined, now = Date.now()): AccessRole | null {
  if (!token) return null
  const [role, expRaw, sig] = token.split('.')
  if ((role !== 'owner' && role !== 'beta') || !expRaw || !sig) return null
  const exp = Number(expRaw)
  if (!Number.isFinite(exp) || exp * 1000 <= now) return null
  const key = keyFor(role)
  if (!key) return null
  const expected = sign(role, exp, key)
  if (!digestEqual(sig, expected)) return null
  return role
}

export const ACCESS_COOKIE = 'spv_access'
export const ACCESS_COOKIE_MAX_AGE = MAX_AGE_SEC

function configuredCodes() {
  return {
    owner: envValue('SPV_OWNER_CODE'),
    beta: envValue('SPV_BETA_CODE'),
  }
}

/** Dynamic lookup so the values stay runtime env vars on Vercel, not build-time blanks. */
function envValue(name: string): string {
  return (process.env[name] || '').trim()
}

function keyFor(role: AccessRole): string {
  const codes = configuredCodes()
  return role === 'owner' ? codes.owner : codes.beta
}

function sign(role: AccessRole, exp: number, key: string): string {
  return createHmac('sha256', key).update(`${role}.${exp}`).digest('base64url')
}

function digestEqual(a: string, b: string): boolean {
  const left = createHash('sha256').update(a).digest()
  const right = createHash('sha256').update(b).digest()
  return timingSafeEqual(left, right)
}
