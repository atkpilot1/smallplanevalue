import { z } from 'zod'
import { ownershipContext } from '../data/operatingCosts'

const querySchema = z.object({
  make: z.string().optional().default(''),
  model: z.string().optional().default(''),
  nnumber: z.string().optional().default(''),
})

export default defineEventHandler((event) => {
  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid query' })
  }
  const { make, model, nnumber } = parsed.data
  if (!make && !model && !nnumber) {
    throw createError({ statusCode: 400, statusMessage: 'Provide make, model, or nnumber' })
  }
  return ownershipContext(make, model, nnumber || null)
})
