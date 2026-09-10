import { supabaseGet, supabaseInsert } from './supabase'
import { getCreditBalance, valuationLimitsEnabled } from './credits'
import { stripeConfigured } from './stripe'
import { PRODUCTS } from './products'
export const FREE_VALUATIONS_PER_MONTH = 1

function monthStartIso(): string {
  const d = new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString()
}

export async function countValuationsThisMonth(clientId: string): Promise<number> {
  const since = monthStartIso()
  const rows = (await supabaseGet(
    `usage_events?client_id=eq.${encodeURIComponent(clientId)}&feature=eq.valuate&created_at=gte.${encodeURIComponent(since)}&select=id`,
  )) as unknown[]
  return Array.isArray(rows) ? rows.length : 0
}

export async function getValuationAccess(clientId: string) {
  const limitsEnabled = valuationLimitsEnabled()
  const credits = clientId ? await getCreditBalance(clientId) : 0
  const used = limitsEnabled && clientId ? await countValuationsThisMonth(clientId) : 0
  const limit = FREE_VALUATIONS_PER_MONTH
  const freeRemaining = limitsEnabled ? Math.max(0, limit - used) : 999
  const remaining = freeRemaining + credits

  return {
    limit,
    used: limitsEnabled ? used : 0,
    remaining,
    freeRemaining,
    credits,
    betaFreeAccess: !limitsEnabled,
    limitsEnabled,
    stripeConfigured: stripeConfigured(),
    periodStart: monthStartIso(),
    products: [
      { id: PRODUCTS.single.id, name: PRODUCTS.single.name, credits: PRODUCTS.single.credits, amountCents: PRODUCTS.single.amountCents },
      { id: PRODUCTS.fivepack.id, name: PRODUCTS.fivepack.name, credits: PRODUCTS.fivepack.credits, amountCents: PRODUCTS.fivepack.amountCents },
    ],
  }
}

export async function recordValuationUsage(
  clientId: string,
  email: string | null | undefined,
  metadata: Record<string, unknown>,
): Promise<void> {
  await supabaseInsert('usage_events', {
    client_id: clientId,
    email: email || null,
    feature: 'valuate',
    metadata,
  })
}
