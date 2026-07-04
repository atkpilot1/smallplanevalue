import { z } from 'zod'

const bodySchema = z.object({
  clientId: z.string().min(8),
  email: z.string().email(),
  make: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  year: z.union([z.string(), z.number()]).optional().nullable(),
})

/** Register email when user hits the free valuation limit (Phase 1 lead capture). */
export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Valid email required' })
  }

  const { clientId, email, make, model, year } = parsed.data
  const yearNum = year != null && year !== '' ? parseInt(String(year), 10) : null
  const aircraft = [make, model, year].filter(Boolean).join(' ').trim() || null

  await supabaseInsert('lookup_leads', {
    email: email.trim().toLowerCase(),
    nnumber: null,
    make: make || null,
    model: model || null,
    year: Number.isFinite(yearNum) ? yearNum : null,
    utm_source: 'spv_valuation_gate',
    utm_medium: 'web',
    utm_campaign: 'phase1_limit',
    user_agent: getHeader(event, 'user-agent') || null,
  })

  // Tie email to this browser for future paid tier (no extra valuation credit in Phase 1).
  await supabaseInsert('usage_events', {
    client_id: clientId,
    email: email.trim().toLowerCase(),
    feature: 'valuation_email_registered',
    metadata: { aircraft, make, model, year: yearNum },
  })

  return { ok: true }
})
