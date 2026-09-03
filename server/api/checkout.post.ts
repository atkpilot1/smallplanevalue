import { z } from 'zod'
import { requireAuthUser } from '../utils/supabase'
import { skuCredits, skuPriceId, stripeClient } from '../utils/stripe'

const bodySchema = z.object({
  sku: z.enum(['single', 'pack']),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Choose 1 valuation or a pack of 5.' })
  }

  const sku = parsed.data.sku
  const credits = skuCredits(sku)
  const origin = getRequestURL(event).origin
  const session = await stripeClient().checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: skuPriceId(sku), quantity: 1 }],
    customer_email: user.email || undefined,
    client_reference_id: user.id,
    metadata: {
      user_id: user.id,
      credits: String(credits),
    },
    success_url: `${origin}/?tab=val&paid=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?tab=val&paid=0`,
  })

  if (!session.url) {
    throw createError({ statusCode: 502, statusMessage: 'Stripe did not return a checkout URL.' })
  }

  return { url: session.url, id: session.id }
})
