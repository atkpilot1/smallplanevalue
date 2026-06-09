import { z } from 'zod'

const bodySchema = z.object({
  email: z.string().optional().nullable(),
  aircraft: z.string().optional().nullable(),
  accuracy: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid feedback' })
  }
  const { email, aircraft, accuracy, message } = parsed.data

  await supabaseInsert('feedback', {
    email: email || null,
    aircraft: aircraft || null,
    accuracy: accuracy || null,
    message: message || null,
  })

  return { ok: true }
})
