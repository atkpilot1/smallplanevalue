import { z } from 'zod'
import { generateObject, type ModelMessage } from 'ai'

const imageSchema = z.object({
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  data: z.string().min(32).max(1_500_000),
})

const bodySchema = z
  .object({
    text: z.string().optional().default(''),
    image: imageSchema.optional(),
  })
  .refine((body) => body.text.trim().length > 0 || !!body.image, {
    message: 'No listing provided',
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

function listingPrompt(text: string, hasImage: boolean): string {
  let prompt =
    'Parse this aircraft listing and extract structured data. Use null for any unknown field. ' +
    'Example shape: {"make":"BEECH","model":"B58","year":1981,"ttaf":4673,"engines":2,"smoh":0,"smohR":0,"propHrs":689,"propHrsR":689,"condition":"Good","cosmetics":"Average","avionics":["GTX345","KFC200","GNS480","A/C","TAWS"],"notes":"RAM engines, Bose LEMO jacks, dual Insight G2 monitors"}\n\n' +
    'In avionics[], include comfort/safety tokens when mentioned: A/C or air conditioning; FIKI (certified known ice) vs inadvertent/known-ice TKS separately; AOA; TAWS; synthetic vision/SVT; Oshkosh or EAA award winner.\n\n'

  if (hasImage) {
    prompt +=
      'A screenshot of the listing is attached. Read the visible listing, including headings, prices, times, and equipment. '
  }
  if (text) prompt += 'LISTING:\n' + text
  else if (hasImage) prompt += 'The listing is in the screenshot.'
  return prompt
}

function decodeImage(data: string): Uint8Array {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data) || data.length % 4 !== 0) {
    throw createError({ statusCode: 400, statusMessage: 'Screenshot could not be read' })
  }
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  if (bytes.length < 32 || bytes.length > 1_200_000) {
    throw createError({ statusCode: 400, statusMessage: 'Screenshot could not be read' })
  }
  return bytes
}

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'No listing provided' })
  }

  const text = parsed.data.text.trim().substring(0, 5000)
  const image = parsed.data.image
  const prompt = listingPrompt(text, !!image)

  const messages: ModelMessage[] | undefined = image
    ? [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image',
              image: decodeImage(image.data),
              mediaType: image.mediaType,
            },
          ],
        },
      ]
    : undefined

  const { object } = await generateObject({
    model: anthropic()(models().fast),
    schema: listingSchema,
    ...(messages ? { messages } : { prompt }),
    maxOutputTokens: 1000,
  })

  return object
})
