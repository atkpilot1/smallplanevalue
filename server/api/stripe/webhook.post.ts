import { stripeClient, stripeConfig, fulfillCheckoutSession } from '../../utils/stripe'

export default defineEventHandler(async (event) => {
  const raw = await readRawBody(event)
  if (!raw) {
    throw createError({ statusCode: 400, statusMessage: 'Missing body' })
  }
  const signature = getHeader(event, 'stripe-signature')
  const { webhookSecret } = stripeConfig()
  if (!signature || !webhookSecret) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid signature' })
  }

  let stripeEvent
  try {
    stripeEvent = stripeClient().webhooks.constructEvent(raw, signature, webhookSecret)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid signature' })
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    await fulfillCheckoutSession(stripeEvent.data.object, stripeEvent.id)
  }

  return { received: true }
})
