import { z } from 'zod'
import { getValuationAccess } from '../utils/valuationAccess'
import { isValidEvaluatorCode } from '../utils/evaluatorCode'

const querySchema = z.object({
  clientId: z.string().min(8),
  evaluatorCode: z.string().optional().default(''),
})

export default defineEventHandler(async (event) => {
  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'clientId required' })
  }

  const bypass = isValidEvaluatorCode(parsed.data.evaluatorCode)
  return await getValuationAccess(parsed.data.clientId, { bypass })
})
