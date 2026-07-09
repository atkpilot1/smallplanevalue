import { z } from 'zod'
import { generateObject } from 'ai'

const bodySchema = z.object({
  text: z.string().min(1),
})

const saleSchema = z.object({
  make: z.string().nullable(),
  model: z.string().nullable(),
  year: z.number().nullable(),
  salePrice: z.number().nullable(),
  askingPrice: z.number().nullable(),
  ttaf: z.number().nullable(),
  smoh: z.number().nullable(),
  saleMonth: z.string().nullable(),
  region: z.string().nullable(),
  avionicsTier: z.string().nullable(),
  daysOnMarket: z.string().nullable(),
  avionics: z.array(z.string()).nullable(),
  notes: z.string().nullable(),
})

const REGION_OPTIONS = [
  'Northeast US',
  'Southeast US',
  'Midwest US',
  'Southwest US',
  'Northwest US',
  'West Coast US',
  'Canada',
  'Other / International',
] as const

const AVIONICS_TIER_OPTIONS = [
  'Steam gauges / basic VFR',
  'Basic IFR (one nav/com, no GPS)',
  'Mid panel (430/530 or equivalent)',
  'Modern IFR (GTN/Avidyne + ADS-B)',
  'Full glass (G1000, Avidyne Entegra)',
] as const

const DOM_OPTIONS = [
  'Under 30 days',
  '1-3 months',
  '3-6 months',
  '6-12 months',
  'Over a year',
  "Don't know",
] as const

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'No sale post provided' })
  }

  const txt = parsed.data.text.substring(0, 5000)
  const prompt =
    'Parse this aircraft sale post or sold listing (BeechTalk, Controller, forum FSBO, broker recap, etc.) and extract structured transaction data. Use null for unknown fields.\n\n' +
    'Rules:\n' +
    '- salePrice: actual closed/sold price if stated ("sold for", "sale price", "went for", "buyer paid"). null if only an asking price is shown.\n' +
    '- askingPrice: original list/asking price if stated. null if unknown.\n' +
    '- saleMonth: approximate sale month as YYYY-MM if a month/year is mentioned; else null.\n' +
    '- region: pick the closest match from: ' +
    REGION_OPTIONS.join(', ') +
    '. Infer US region from state if needed.\n' +
    '- avionicsTier: pick the closest match from: ' +
    AVIONICS_TIER_OPTIONS.join(', ') +
    '.\n' +
    '- daysOnMarket: pick the closest match from: ' +
    DOM_OPTIONS.join(', ') +
    ' when time on market is mentioned.\n' +
    '- avionics[]: notable equipment tokens (G1000, GTN750, IO-550, TKS, A/C, etc.).\n' +
    '- notes: brief condition/equipment context not captured elsewhere.\n\n' +
    'Example: {"make":"Beechcraft","model":"A36","year":1998,"salePrice":285000,"askingPrice":310000,"ttaf":4200,"smoh":650,"saleMonth":"2025-11","region":"Southeast US","avionicsTier":"Modern IFR (GTN/Avidyne + ADS-B)","daysOnMarket":"3-6 months","avionics":["GTN750","G5","TKS"],"notes":"Turbonormalized IO-550, fresh annual"}\n\n' +
    'POST:\n' +
    txt

  const { object } = await generateObject({
    model: anthropic()(models().fast),
    schema: saleSchema,
    prompt,
    maxOutputTokens: 1200,
  })

  return object
})
