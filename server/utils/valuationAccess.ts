import { supabaseGet, supabaseInsert } from './supabase'
import { consumeCredit, getCreditBalance } from './credits'

/** Public beta: unlimited valuations. Set true before paid launch. */
export const VALUATION_LIMITS_ENABLED = false

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
  const credits = clientId ? await getCreditBalance(clientId) : 0

  if (!VALUATION_LIMITS_ENABLED) {
    return {
      limit: FREE_VALUATIONS_PER_MONTH,
      used: 0,
      remaining: 999,
      credits,
      betaFreeAccess: true,
      periodStart: monthStartIso(),
    }
  }

  const used = clientId ? await countValuationsThisMonth(clientId) : 0
  const limit = FREE_VALUATIONS_PER_MONTH
  const freeRemaining = Math.max(0, limit - used)
  return {
    limit,
    used,
    remaining: freeRemaining,
    credits,
    canValuate: freeRemaining > 0 || credits > 0,
    betaFreeAccess: false,
    periodStart: monthStartIso(),
  }
}

/**
 * When limits are on: allow free monthly quota first, then paid credits.
 * Returns how access was granted (for logging).
 */
export async function assertCanValuate(clientId: string): Promise<{
  ok: boolean
  via: 'beta' | 'free' | 'credit' | 'blocked'
}> {
  if (!VALUATION_LIMITS_ENABLED) return { ok: true, via: 'beta' }
  if (!clientId) return { ok: false, via: 'blocked' }

  const used = await countValuationsThisMonth(clientId)
  if (used < FREE_VALUATIONS_PER_MONTH) return { ok: true, via: 'free' }

  const consumed = await consumeCredit(clientId)
  if (consumed) return { ok: true, via: 'credit' }

  return { ok: false, via: 'blocked' }
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
