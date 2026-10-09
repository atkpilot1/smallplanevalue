/** Booth-typed codes: ignore case, spaces, and hyphens. */
export function normalizePromoCode(raw: string) {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

/** One booth code. Grant once per account via a stable stripe_events session id. */
export const TRADESHOW_PROMO = {
  code: 'TRADESHOW',
  credits: 25,
} as const

export function matchPromo(raw: string): { code: string; credits: number } | null {
  const code = normalizePromoCode(raw)
  if (code !== TRADESHOW_PROMO.code) return null
  return { code: TRADESHOW_PROMO.code, credits: TRADESHOW_PROMO.credits }
}

export function promoSessionId(code: string, userId: string) {
  return `promo:${code}:${userId}`
}
