import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function stripeConfigured(): boolean {
  return Boolean(useRuntimeConfig().stripeSecretKey)
}

export function getStripe(): Stripe {
  const key = useRuntimeConfig().stripeSecretKey
  if (!key) {
    throw createError({ statusCode: 503, statusMessage: 'Payments are not configured yet' })
  }
  if (!_stripe) {
    _stripe = new Stripe(key)
  }
  return _stripe
}
