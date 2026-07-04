import { z } from 'zod'

const bodySchema = z.object({
  email: z.string().email(),
  nnumber: z.string().optional().nullable(),
  make: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  year: z.union([z.string(), z.number()]).optional().nullable(),
  utm_source: z.string().optional().nullable(),
  utm_medium: z.string().optional().nullable(),
  utm_campaign: z.string().optional().nullable(),
  user_agent: z.string().optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Valid email required' })
  }

  const d = parsed.data
  const nn = (d.nnumber || '').replace(/^N/i, '').trim().toUpperCase() || null
  const yearNum = d.year != null && d.year !== '' ? parseInt(String(d.year), 10) : null

  await supabaseInsert('lookup_leads', {
    email: d.email.trim().toLowerCase(),
    nnumber: nn,
    make: d.make || null,
    model: d.model || null,
    year: Number.isFinite(yearNum) ? yearNum : null,
    utm_source: d.utm_source || null,
    utm_medium: d.utm_medium || null,
    utm_campaign: d.utm_campaign || null,
    user_agent: d.user_agent || null,
  })

  return { ok: true }
})
