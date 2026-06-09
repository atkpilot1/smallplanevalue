import { z } from 'zod'
import { generateObject } from 'ai'

const bodySchema = z.object({
  model: z.string().min(1),
  years: z.string().optional().default(''),
})

const listingSchema = z.object({
  year: z.number(),
  ttaf: z.number(),
  smoh: z.number(),
  cond: z.string(),
  ask: z.number(),
  avionics: z.string(),
  daysListed: z.number(),
})

const compsSchema = z.object({
  summary: z.string(),
  askLow: z.number(),
  askMid: z.number(),
  askHigh: z.number(),
  avgDaysListed: z.number(),
  activeListings: z.number(),
  negotiationNote: z.string(),
  listings: z.array(listingSchema),
})

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Enter a model.' })
  }
  const { model, years } = parsed.data

  let prompt =
    'You are an aircraft market analyst with current 2025-2026 data. Generate a realistic market comparison for: ' +
    model +
    (years ? ' (years ' + years + ')' : '') +
    '.\n\n'
  prompt +=
    'Use accurate 2025-2026 asking prices:\n- Beech Baron 55/58: $180k-$420k. Bonanza A36/V35: $150k-$400k.\n'
  prompt +=
    '- Cessna 172: $80k-$250k. 182: $120k-$350k. 210: $150k-$400k.\n'
  prompt +=
    '- Cirrus SR20: $150k-$350k. SR22: $240k-$1M+. SR22T: $350k-$1.1M+.\n'
  prompt +=
    '- Piper Archer/Cherokee: $50k-$150k. Saratoga: $180k-$400k. Mooney M20: $100k-$350k. RV-10: $260k-$530k.\n\n'
  prompt +=
    'Provide 5 representative current listings with realistic spread. Vary year, hours, condition, avionics and asking price. Use ask:0 to represent a "Call for Price" listing. Reflect real market conditions, days-on-market and active inventory.\n\n'
  prompt +=
    'Return JSON shape: {"summary":"...","askLow":NUMBER,"askMid":NUMBER,"askHigh":NUMBER,"avgDaysListed":NUMBER,"activeListings":NUMBER,"negotiationNote":"...","listings":[{"year":NUMBER,"ttaf":NUMBER,"smoh":NUMBER,"cond":"Good","ask":NUMBER,"avionics":"...","daysListed":NUMBER}]}'

  const { object } = await generateObject({
    model: anthropic()(models().main),
    schema: compsSchema,
    prompt,
    maxOutputTokens: 1500,
  })

  return object
})
