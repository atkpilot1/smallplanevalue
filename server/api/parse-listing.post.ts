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
    'Parse this aircraft listing and extract structured data. Use null for any unknown field. ' +
    'Example shape: {"make":"BEECH","model":"B58","year":1981,"ttaf":4673,"engines":2,"smoh":0,"smohR":0,"propHrs":689,"propHrsR":689,"condition":"Good","cosmetics":"Average","avionics":["GTX345","KFC200","GNS480"],"notes":"RAM engines, Bose LEMO jacks, dual Insight G2 monitors"}\n\n' +
    'LISTING:\n' +
    txt

  const { object } = await generateObject({
    model: anthropic()(models().fast),
    schema: listingSchema,
    prompt,
    maxOutputTokens: 1000,
  })

  return object
})
