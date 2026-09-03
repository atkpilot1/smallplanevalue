import Stripe from 'stripe'
import { grantCredits } from './valuationAccess'

export type CheckoutSku = 'single' | 'pack'

function envOrConfig(...values: unknown[]) {
  for (const value of values) {
    const s = typeof value === 'string' ? value.trim() : ''
    if (s) return s
  }
  return ''
}

export function stripeConfig() {
  const config = useRuntimeConfig()
  const env = process.env
  return {
    secretKey: envOrConfig(env.STRIPE_SECRET_KEY, env.NUXT_STRIPE_SECRET_KEY, config.stripeSecretKey),
    webhookSecret: envOrConfig(
      env.STRIPE_WEBHOOK_SECRET,
      env.NUXT_STRIPE_WEBHOOK_SECRET,
      config.stripeWebhookSecret,
    ),
    priceSingle: envOrConfig(env.STRIPE_PRICE_SINGLE, env.NUXT_STRIPE_PRICE_SINGLE, config.stripePriceSingle),
    pricePack: envOrConfig(env.STRIPE_PRICE_PACK, env.NUXT_STRIPE_PRICE_PACK, config.stripePricePack),
  }
}

export function requireStripeConfig() {
  const cfg = stripeConfig()
  const missing: string[] = []
  if (!cfg.secretKey) missing.push('STRIPE_SECRET_KEY')
  if (!cfg.webhookSecret) missing.push('STRIPE_WEBHOOK_SECRET')
  if (!cfg.priceSingle) missing.push('STRIPE_PRICE_SINGLE')
  if (!cfg.pricePack) missing.push('STRIPE_PRICE_PACK')
  if (missing.length) {
    throw new Error(
      `Missing required Stripe environment variables: ${missing.join(', ')}. ` +
        'Set them in the environment. Playwright uses .env.test placeholders.',
    )
  }
  return cfg
}

export function stripeClient() {
  return new Stripe(requireStripeConfig().secretKey)
}

export function skuCredits(sku: CheckoutSku) {
  return sku === 'pack' ? 5 : 1
}

export function skuPriceId(sku: CheckoutSku) {
  const { priceSingle, pricePack } = requireStripeConfig()
  return sku === 'pack' ? pricePack : priceSingle
}

export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session,
  eventId?: string,
) {
  if (session.payment_status !== 'paid') {
    return { granted: false, credit_balance: 0, paid: false }
  }
  const userId = session.metadata?.user_id || session.client_reference_id || ''
  const credits = parseInt(session.metadata?.credits || '', 10)
  if (!userId || !session.id || !Number.isFinite(credits) || credits <= 0) {
    return { granted: false, credit_balance: 0, paid: true }
  }
  return { ...(await grantCredits(userId, credits, session.id, eventId)), paid: true }
}
