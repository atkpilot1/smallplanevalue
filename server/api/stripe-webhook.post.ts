import { getStripe, PACK_CREDITS, type CheckoutPack } from '../utils/stripe'
import { grantCredits } from '../utils/credits'

export default defineEventHandler(async (event) => {
  const stripe = getStripe()
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    throw createError({ statusCode: 500, statusMessage: 'STRIPE_WEBHOOK_SECRET not configured' })
  }

  const rawBody = await readRawBody(event)
  if (!rawBody) {
    throw createError({ statusCode: 400, statusMessage: 'Missing body' })
  }

  const signature = getHeader(event, 'stripe-signature')
  if (!signature) {
    throw createError({ statusCode: 400, statusMessage: 'Missing stripe-signature' })
  }

  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, secret)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid signature'
    throw createError({ statusCode: 400, statusMessage: msg })
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object
    const clientId =
      session.client_reference_id ||
      session.metadata?.client_id ||
      ''
    const pack = (session.metadata?.pack || 'single') as CheckoutPack
    const credits = Number(session.metadata?.credits) || PACK_CREDITS[pack] || 1
    const email = session.customer_details?.email || session.customer_email || null

    if (!clientId) {
      console.error('checkout.session.completed missing client_id', session.id)
    } else {
      const result = await grantCredits({
        clientId,
        email,
        credits,
        stripeSessionId: session.id,
        pack,
        amountTotal: session.amount_total,
        stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
      })
      console.log('Stripe fulfillment', {
        sessionId: session.id,
        clientId,
        credits,
        granted: result.granted,
        balance: result.balance,
      })
    }
  }

  return { received: true }
})
