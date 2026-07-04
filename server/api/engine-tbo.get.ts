import { z } from 'zod'
import { engineLifeRemaining, lookupEngineTbo } from '../data/engineTbo'

const querySchema = z.object({
  model: z.string().optional().default(''),
  make: z.string().optional().default(''),
  smoh: z.coerce.number().optional(),
})

export default defineEventHandler((event) => {
  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid query' })
  }

  const { model, make, smoh } = parsed.data
  const spec = lookupEngineTbo(model, make)

  const result: Record<string, unknown> = {
    model: model || null,
    make: make || null,
    tbo: spec.tbo,
    overhaulCost: spec.overhaulCost,
    matchType: spec.matchType,
    matchedKey: spec.matchedKey,
  }

  if (smoh != null && !Number.isNaN(smoh) && smoh >= 0) {
    result.life = engineLifeRemaining(smoh, spec.tbo)
  }

  return result
})
