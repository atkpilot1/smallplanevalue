import { supabaseAdminGet, supabaseAdminInsert, supabaseAdminRpc } from './supabase'

/** Public beta: unlimited valuations. Set true before paid launch. */
export const VALUATION_LIMITS_ENABLED = false

export const FREE_VALUATIONS_PER_MONTH = 1

function monthStartIso(): string {
  const d = new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString()
}

export async function incrementValuationCount(userId: string): Promise<number> {
  const next = await supabaseAdminRpc<number>('increment_valuation_count', { p_user_id: userId })
  return typeof next === 'number' ? next : 0
}

export async function countValuationsThisMonth(clientId: string): Promise<number> {
  const since = monthStartIso()
  const rows = (await supabaseAdminGet(
    `usage_events?client_id=eq.${encodeURIComponent(clientId)}&feature=eq.valuate&created_at=gte.${encodeURIComponent(since)}&select=id`,
  )) as unknown[]
  return Array.isArray(rows) ? rows.length : 0
}

export async function getValuationAccess(clientId: string) {
  if (!VALUATION_LIMITS_ENABLED) {
    return {
      limit: FREE_VALUATIONS_PER_MONTH,
      used: 0,
      remaining: 999,
      betaFreeAccess: true,
      periodStart: monthStartIso(),
    }
  }

  const used = clientId ? await countValuationsThisMonth(clientId) : 0
  const limit = FREE_VALUATIONS_PER_MONTH
  return {
    limit,
    used,
    remaining: Math.max(0, limit - used),
    betaFreeAccess: false,
    periodStart: monthStartIso(),
  }
}

export async function recordValuationUsage(
  clientId: string,
  email: string | null | undefined,
  metadata: Record<string, unknown>,
  userId?: string,
): Promise<void> {
  await supabaseAdminInsert('usage_events', {
    client_id: clientId,
    user_id: userId || null,
    email: email || null,
    feature: 'valuate',
    metadata,
  })
}
