import { z } from 'zod'
import { getValuationAccess, VALUATION_LIMITS_ENABLED } from '../utils/valuationAccess'

const querySchema = z.object({
  clientId: z.string().min(8),
})

export default defineEventHandler(async (event) => {
  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'clientId required' })
  }

  return {
    ...(await getValuationAccess(parsed.data.clientId)),
    betaFreeAccess: !VALUATION_LIMITS_ENABLED,
  }
})
