import Stripe from 'stripe'

export type CheckoutPack = 'single' | 'fivepack'

export const PACK_CREDITS: Record<CheckoutPack, number> = {
  single: 1,
  fivepack: 5,
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw createError({ statusCode: 500, statusMessage: 'Stripe is not configured' })
  }
  return new Stripe(key)
}

export function priceIdForPack(pack: CheckoutPack): string {
  const id =
    pack === 'fivepack' ? process.env.STRIPE_PRICE_FIVEPACK : process.env.STRIPE_PRICE_SINGLE
  if (!id) {
    throw createError({
      statusCode: 500,
      statusMessage: `Missing Stripe price for pack: ${pack}`,
    })
  }
  return id
}

export function siteOrigin(): string {
  return (process.env.SITE_URL || 'https://www.smallplanevalue.com').replace(/\/$/, '')
}

/** Random 8-letter suffix for Checkout integration_identifier. */
export function checkoutIntegrationId(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'
  let suffix = ''
  for (let i = 0; i < 8; i++) suffix += alphabet[Math.floor(Math.random() * alphabet.length)]
  return `spv_valuation_${suffix}`
}
