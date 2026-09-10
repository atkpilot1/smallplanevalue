import { z } from 'zod'
import { getProduct, isProductId } from '../utils/products'
import { getStripe, stripeConfigured } from '../utils/stripe'
import { publicSiteUrl } from '../utils/credits'

const bodySchema = z.object({
  product: z.string(),
  clientId: z.string().min(8),
  email: z.string().optional().nullable(),
})

export default defineEventHandler(async (event) => {
  if (!stripeConfigured()) {
    throw createError({ statusCode: 503, statusMessage: 'Payments are not configured yet' })
  }

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success || !isProductId(parsed.data.product)) {
    throw createError({ statusCode: 400, statusMessage: 'Choose a valuation pack' })
  }

  const product = getProduct(parsed.data.product)
  const config = useRuntimeConfig()
  const origin = publicSiteUrl(event)
  const priceId = product.id === 'single' ? config.stripePriceSingle : config.stripePriceFivepack
  const rawEmail = (parsed.data.email || '').trim().toLowerCase()
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail) ? rawEmail : undefined

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    allow_promotion_codes: true,
    client_reference_id: parsed.data.clientId,
    customer_email: email,
    success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}#app`,
    cancel_url: `${origin}/?checkout=cancel#pricing`,
    metadata: {
      clientId: parsed.data.clientId,
      product: product.id,
      credits: String(product.credits),
    },
    payment_intent_data: {
      description: product.name,
      metadata: {
        clientId: parsed.data.clientId,
        product: product.id,
      },
    },
    line_items: [
      priceId
        ? { price: priceId, quantity: 1 }
        : {
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: product.amountCents,
              product_data: {
                name: product.name,
                description: product.description,
              },
            },
          },
    ],
  })

  if (!session.url) {
    throw createError({ statusCode: 502, statusMessage: 'Stripe did not return a checkout URL' })
  }

  return { url: session.url, sessionId: session.id }
})
