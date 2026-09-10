import type Stripe from 'stripe'
import { getProduct, isProductId } from './products'
import { grantCredits } from './credits'
import { getStripe, stripeConfigured } from './stripe'

export async function fulfillCheckoutSession(session: Stripe.Checkout.Session, eventId?: string) {
  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
    return { ok: false, skipped: true, reason: 'unpaid', balance: 0, credits: 0 }
  }

  const clientId = String(session.metadata?.clientId || session.client_reference_id || '').trim()
  const productId = session.metadata?.product
  if (!clientId || !isProductId(productId)) {
    throw createError({ statusCode: 400, statusMessage: 'Checkout session is missing product metadata' })
  }

  const product = getProduct(productId)
  const email = session.customer_details?.email || session.customer_email || null
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id || null
  const amountCents = session.amount_total ?? product.amountCents

  const granted = await grantCredits({
    clientId,
    email,
    credits: product.credits,
    sessionId: session.id,
    product: product.id,
    amountCents,
    customerId,
    eventId: eventId || null,
  })

  return {
    ok: true,
    duplicate: Boolean(granted.duplicate),
    balance: granted.balance,
    credits: product.credits,
    product: product.id,
  }
}

export async function fulfillPaidSession(sessionId: string, expectedClientId: string) {
  if (!stripeConfigured()) {
    throw createError({ statusCode: 503, statusMessage: 'Payments are not configured yet' })
  }

  const session = await getStripe().checkout.sessions.retrieve(sessionId)
  const sessionClient = String(session.metadata?.clientId || session.client_reference_id || '')
  if (sessionClient && sessionClient !== expectedClientId) {
    throw createError({ statusCode: 403, statusMessage: 'This checkout session belongs to another browser' })
  }

  return await fulfillCheckoutSession(session)
}
