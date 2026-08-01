import { z } from 'zod'
import { generateObject } from 'ai'

const bodySchema = z.object({
  text: z.string().min(1),
})

const listingSchema = z.object({
  make: z.string().nullable(),
  model: z.string().nullable(),
  year: z.number().nullable(),
  ttaf: z.number().nullable(),
  engines: z.number().nullable(),
  smoh: z.number().nullable(),
  smohR: z.number().nullable(),
  propHrs: z.number().nullable(),
  propHrsR: z.number().nullable(),
  askingPrice: z.number().nullable(),
  condition: z.string().nullable(),
  cosmetics: z.string().nullable(),
  avionics: z.array(z.string()).nullable(),
  notes: z.string().nullable(),
})

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'No listing provided' })
  }

  const txt = parsed.data.text.substring(0, 5000)
  const prompt =
    'Parse this aircraft listing and extract structured data. Use null for any unknown field.\n' +
    'Field rules:\n' +
    '- askingPrice: the advertised asking / list price in whole USD dollars (e.g. $279,000 → 279000). Ignore monthly financing quotes.\n' +
    '- propHrs / propHrsR: propeller time since overhaul (also labeled SPOH, TSOH, TSPOH, prop SMOH, hours since prop OH). For singles use propHrs; for twins use left=propHrs and right=propHrsR.\n' +
    '- smoh / smohR: engine time since major overhaul (SMOH / TSMOH). Twins: left=smoh, right=smohR.\n' +
    '- ttaf: total airframe time.\n' +
    '- engines: 1 or 2 when clear.\n' +
    '- avionics[]: equipment tokens including transponders (GTX 330 ES, GTX 335, GTX 345), GPS/NAV/COM, autopilots, engine monitors.\n' +
    'Example shape: {"make":"BEECH","model":"B58","year":1981,"ttaf":4673,"engines":2,"smoh":0,"smohR":0,"propHrs":689,"propHrsR":689,"askingPrice":279000,"condition":"Good","cosmetics":"Average","avionics":["GTX345","KFC200","GNS480","A/C","TAWS"],"notes":"RAM engines, Bose LEMO jacks, dual Insight G2 monitors"}\n\n' +
    'In avionics[], include comfort/safety tokens when mentioned: A/C or air conditioning; FIKI (certified known ice) vs inadvertent/known-ice TKS separately; AOA; TAWS; synthetic vision/SVT; Oshkosh or EAA award winner.\n\n' +
    'LISTING:\n' +
    txt

  const { object } = await generateObject({
    model: anthropic()(models().fast),
    schema: listingSchema,
    prompt,
    maxOutputTokens: 1000,
    temperature: 0,
  })

  return object
})
