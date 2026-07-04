import { z } from 'zod'

const querySchema = z.object({
  clientId: z.string().min(8),
})

export default defineEventHandler(async (event) => {
  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'clientId required' })
  }

  return await getValuationAccess(parsed.data.clientId)
})
