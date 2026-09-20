import { requireStripeConfig } from '../utils/stripe'

/**
 * Fail on boot if Stripe is not configured. Dummy in-code defaults used to
 * let production start without secrets; that is no longer allowed.
 * Playwright loads placeholders from `.env.test`.
 */
export default defineNitroPlugin(() => {
  if (import.meta.prerender) return
  requireStripeConfig()
})
