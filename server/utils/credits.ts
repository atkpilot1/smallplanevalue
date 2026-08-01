import { supabaseGet, supabaseInsert, supabaseUpsert, supabaseUpdate } from './supabase'

export async function getCreditBalance(clientId: string): Promise<number> {
  if (!clientId) return 0
  try {
    const rows = (await supabaseGet(
      `user_credits?client_id=eq.${encodeURIComponent(clientId)}&select=balance&limit=1`,
    )) as Array<{ balance: number }>
    if (!Array.isArray(rows) || !rows.length) return 0
    return Math.max(0, Number(rows[0].balance) || 0)
  } catch {
    return 0
  }
}

export async function grantCredits(opts: {
  clientId: string
  email?: string | null
  credits: number
  stripeSessionId: string
  pack?: string | null
  amountTotal?: number | null
  stripeCustomerId?: string | null
}): Promise<{ granted: boolean; balance: number }> {
  const { clientId, credits, stripeSessionId } = opts
  if (!clientId || credits <= 0 || !stripeSessionId) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid credit grant' })
  }

  // Idempotency: already fulfilled this Checkout Session?
  try {
    const prior = (await supabaseGet(
      `stripe_fulfillments?stripe_session_id=eq.${encodeURIComponent(stripeSessionId)}&select=stripe_session_id&limit=1`,
    )) as unknown[]
    if (Array.isArray(prior) && prior.length) {
      return { granted: false, balance: await getCreditBalance(clientId) }
    }
  } catch {
    // table may not exist yet — continue and let insert fail loudly
  }

  await supabaseInsert('stripe_fulfillments', {
    stripe_session_id: stripeSessionId,
    client_id: clientId,
    email: opts.email || null,
    credits,
    pack: opts.pack || null,
    amount_total: opts.amountTotal ?? null,
  })

  const current = await getCreditBalance(clientId)
  const next = current + credits
  await supabaseUpsert(
    'user_credits',
    {
      client_id: clientId,
      email: opts.email || null,
      stripe_customer_id: opts.stripeCustomerId || null,
      balance: next,
      updated_at: new Date().toISOString(),
    },
    'client_id',
  )
  return { granted: true, balance: next }
}

/** Atomically-ish consume one credit. Returns false if balance was 0. */
export async function consumeCredit(clientId: string): Promise<boolean> {
  const balance = await getCreditBalance(clientId)
  if (balance < 1) return false
  await supabaseUpdate(
    'user_credits',
    { balance: balance - 1, updated_at: new Date().toISOString() },
    `client_id=eq.${encodeURIComponent(clientId)}`,
  )
  return true
}
