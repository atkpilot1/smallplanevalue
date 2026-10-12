import { matchPromo } from './promo'

export const TRADESHOW_STORAGE_KEY = 'spv_tradeshow'

/** Saved booth code for this browser, or '' when there is no authorization. */
export function readTradeshowCode() {
  if (import.meta.server) return ''
  try {
    const raw = localStorage.getItem(TRADESHOW_STORAGE_KEY) || ''
    return matchPromo(raw)?.code || ''
  } catch {
    return ''
  }
}

/** Persist TRADESHOW so valuations stay authorized after sign-in and reload. */
export function saveTradeshowCode(raw: string) {
  if (import.meta.server) return false
  const promo = matchPromo(raw)
  if (!promo) return false
  try {
    localStorage.setItem(TRADESHOW_STORAGE_KEY, promo.code)
  } catch {
    return false
  }
  return true
}
