import { z } from 'zod'
import { fulfillPaidSession } from '../../utils/fulfillCheckout'

const querySchema = z.object({
  session_id: z.string().min(8),
  clientId: z.string().min(8),
})

export default defineEventHandler(async (event) => {
  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'session_id and clientId required' })
  }

  return await fulfillPaidSession(parsed.data.session_id, parsed.data.clientId)
})
