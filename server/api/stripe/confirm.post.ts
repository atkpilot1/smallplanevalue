import { z } from 'zod'
import { requireAuthUser } from '../../utils/supabase'
import { fulfillCheckoutSession, stripeClient } from '../../utils/stripe'

const bodySchema = z.object({
  session_id: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'session_id required' })
  }

  let session
  try {
    session = await stripeClient().checkout.sessions.retrieve(parsed.data.session_id)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Checkout session not found.' })
  }

  const owner = session.metadata?.user_id || session.client_reference_id || ''
  if (owner && owner !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Session does not belong to this account.' })
  }

  return fulfillCheckoutSession(session)
})
