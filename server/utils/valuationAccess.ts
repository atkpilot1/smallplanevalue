import { supabaseGet, supabaseInsert } from './supabase'

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

export async function getValuationAccess(clientId: string, options?: { bypass?: boolean }) {
  if (!VALUATION_LIMITS_ENABLED || options?.bypass) {
    return {
      limit: FREE_VALUATIONS_PER_MONTH,
      used: 0,
      remaining: 999,
      bypass: true,
      betaFreeAccess: !VALUATION_LIMITS_ENABLED,
      periodStart: monthStartIso(),
    }
  }

  const used = clientId ? await countValuationsThisMonth(clientId) : 0
  const limit = FREE_VALUATIONS_PER_MONTH
  return {
    limit,
    used,
    remaining: Math.max(0, limit - used),
    periodStart: monthStartIso(),
  }
}

export async function recordValuationUsage(
  clientId: string,
  email: string | null | undefined,
  metadata: Record<string, unknown>,
  options?: { evaluatorBypass?: boolean },
): Promise<void> {
  await supabaseInsert('usage_events', {
    client_id: clientId,
    email: email || null,
    feature: options?.evaluatorBypass ? 'valuate_evaluator' : 'valuate',
    metadata,
  })
}
