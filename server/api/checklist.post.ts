import { z } from 'zod'
import { generateObject } from 'ai'

const bodySchema = z.object({
  make: z.string().optional().default(''),
  model: z.string().min(1),
  year: z.string().optional().default(''),
  eng: z.string().optional().default(''),
  engModel: z.string().optional().default(''),
  acType: z.string().optional().default(''),
  numEng: z.string().optional().default(''),
  exp: z.string().optional().default(''),
  concerns: z.string().optional().default(''),
  purpose: z.string().optional().default(''),
})

const itemSchema = z.object({
  name: z.string(),
  note: z.string(),
  critical: z.boolean(),
})

const responseSchema = z.object({
  items: z.array(itemSchema),
})

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Enter a model.' })
  }
  const d = parsed.data

  let prompt =
    'You are an A&P/IA mechanic. List 5-8 model-specific pre-buy inspection items for a ' +
    (d.year || '') + ' ' + (d.make || '') + ' ' + d.model + '.\n'
  if (d.eng) prompt += 'Engine: ' + d.eng + (d.engModel ? ' ' + d.engModel : '') + '.\n'
  if (d.exp) prompt += 'Buyer experience: ' + d.exp + '.\n'
  if (d.concerns) prompt += 'Specific concerns: ' + d.concerns + '.\n'
  if (d.purpose) prompt += 'Intended use: ' + d.purpose + '.\n'
  prompt +=
    'Focus on known ADs, service bulletins, common failure points and type-specific weaknesses for THIS make/model. ' +
    'Mark items critical:true when a finding could be a deal-breaker or safety-of-flight issue.\n'
  prompt +=
    'Return JSON shape: {"items":[{"name":"AD 2004-10-14 Wing Spar","note":"Check carry-through spar for corrosion per AD","critical":true}]}'

  const { object } = await generateObject({
    model: anthropic()(models().fast),
    schema: responseSchema,
    prompt,
    maxOutputTokens: 800,
  })

  return object.items
})
