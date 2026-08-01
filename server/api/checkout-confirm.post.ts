import { z } from 'zod'
import { getStripe, PACK_CREDITS, type CheckoutPack } from '../utils/stripe'
import { grantCredits, getCreditBalance } from '../utils/credits'

/**
 * UX helper after redirect from Checkout success_url.
 * Webhook remains source of truth; this grants credits if webhook is delayed.
 */
const bodySchema = z.object({
  sessionId: z.string().min(8),
  clientId: z.string().min(8),
})

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid confirm request' })
  }

  const stripe = getStripe()
  const session = await stripe.checkout.sessions.retrieve(parsed.data.sessionId)
  if (session.payment_status !== 'paid' && session.status !== 'complete') {
    throw createError({ statusCode: 402, statusMessage: 'Payment not completed' })
  }

  const clientId = session.client_reference_id || session.metadata?.client_id || ''
  if (!clientId || clientId !== parsed.data.clientId) {
    throw createError({ statusCode: 403, statusMessage: 'Session does not match this browser' })
  }

  const pack = (session.metadata?.pack || 'single') as CheckoutPack
  const credits = Number(session.metadata?.credits) || PACK_CREDITS[pack] || 1
  const email = session.customer_details?.email || session.customer_email || null

  const result = await grantCredits({
    clientId,
    email,
    credits,
    stripeSessionId: session.id,
    pack,
    amountTotal: session.amount_total,
    stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
  })

  return {
    ok: true,
    granted: result.granted,
    credits,
    balance: result.balance || (await getCreditBalance(clientId)),
    pack,
  }
})
