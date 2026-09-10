import { getStripe, stripeConfigured } from '../utils/stripe'
import { fulfillCheckoutSession } from '../utils/fulfillCheckout'
import type Stripe from 'stripe'

export default defineEventHandler(async (event) => {
  if (!stripeConfigured()) {
    throw createError({ statusCode: 503, statusMessage: 'Payments are not configured yet' })
  }

  const signature = getHeader(event, 'stripe-signature')
  const rawBody = await readRawBody(event)
  const secret = useRuntimeConfig().stripeWebhookSecret

  if (!signature || !rawBody || !secret) {
    throw createError({ statusCode: 400, statusMessage: 'Missing Stripe webhook signature' })
  }

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = await getStripe().webhooks.constructEventAsync(rawBody, signature, secret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    throw createError({ statusCode: 400, statusMessage: message })
  }

  if (
    stripeEvent.type === 'checkout.session.completed' ||
    stripeEvent.type === 'checkout.session.async_payment_succeeded'
  ) {
    await fulfillCheckoutSession(stripeEvent.data.object as Stripe.Checkout.Session, stripeEvent.id)
  }

  return { received: true }
})
