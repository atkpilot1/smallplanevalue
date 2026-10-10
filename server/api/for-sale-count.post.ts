import { z } from 'zod'
import { countForSale } from '../data/aircraftDb'

const bodySchema = z.object({
  make: z.string().max(80).optional().default(''),
  model: z.string().max(80).optional().default(''),
  year: z.union([z.string(), z.number()]).optional(),
})

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Enter a make and model.' })
  }

  const yearRaw = parsed.data.year
  const yearNum =
    yearRaw == null || yearRaw === ''
      ? null
      : typeof yearRaw === 'number'
        ? yearRaw
        : Number.parseInt(yearRaw, 10)

  return countForSale({
    make: parsed.data.make,
    model: parsed.data.model,
    year: yearNum != null && Number.isFinite(yearNum) ? yearNum : null,
  })
})
