import { z } from 'zod'
import {
  checkoutIntegrationId,
  getStripe,
  PACK_CREDITS,
  priceIdForPack,
  siteOrigin,
  type CheckoutPack,
} from '../utils/stripe'

const bodySchema = z.object({
  pack: z.enum(['single', 'fivepack']),
  clientId: z.string().min(8),
  email: z.string().email().optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid checkout request' })
  }

  const { pack, clientId } = parsed.data
  const email = (parsed.data.email || '').trim().toLowerCase() || undefined
  const credits = PACK_CREDITS[pack as CheckoutPack]
  const stripe = getStripe()
  const origin = siteOrigin()

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: priceIdForPack(pack), quantity: 1 }],
    success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?checkout=cancel`,
    client_reference_id: clientId,
    customer_email: email,
    metadata: {
      client_id: clientId,
      pack,
      credits: String(credits),
    },
    integration_identifier: checkoutIntegrationId(),
  })

  if (!session.url) {
    throw createError({ statusCode: 500, statusMessage: 'Stripe did not return a checkout URL' })
  }

  return {
    url: session.url,
    sessionId: session.id,
    pack,
    credits,
    amount: pack === 'fivepack' ? 7900 : 2400,
  }
})
