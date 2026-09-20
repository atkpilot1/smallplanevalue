import { FREE_VALUATIONS, freeRemaining } from '~/utils/credits'
import { supabaseAdminInsert, supabaseAdminRpc } from './supabase'

export type CreditStatus = {
  valuation_count: number
  credit_balance: number
  free_remaining: number
  allowed?: boolean
  granted?: boolean
}

function asCreditStatus(raw: unknown): CreditStatus {
  const v = raw && typeof raw === 'object' ? (raw as CreditStatus) : {}
  const valuation_count = typeof v.valuation_count === 'number' ? v.valuation_count : 0
  const credit_balance = typeof v.credit_balance === 'number' ? v.credit_balance : 0
  return {
    valuation_count,
    credit_balance,
    free_remaining: freeRemaining({ valuation_count, credit_balance }),
    allowed: v.allowed,
    granted: v.granted,
  }
}

function creditsRequired(status: CreditStatus): never {
  throw createError({
    statusCode: 402,
    statusMessage: 'credits_required',
    data: { code: 'credits_required', ...status },
  })
}

export async function consumeValuation(userId: string): Promise<CreditStatus> {
  const status = asCreditStatus(
    await supabaseAdminRpc('consume_valuation', {
      p_user_id: userId,
      p_free: FREE_VALUATIONS,
    }),
  )
  if (status.allowed !== true) creditsRequired(status)
  return status
}

export async function refundValuation(userId: string): Promise<CreditStatus> {
  return asCreditStatus(
    await supabaseAdminRpc('refund_valuation', {
      p_user_id: userId,
      p_free: FREE_VALUATIONS,
    }),
  )
}

/** Claim a slot atomically, run work, refund if the work throws. */
export async function withValuationCredit<T>(userId: string, work: () => Promise<T>): Promise<T> {
  await consumeValuation(userId)
  try {
    return await work()
  } catch (err) {
    try {
      await refundValuation(userId)
    } catch (refundErr) {
      console.error('refund_valuation failed', userId, refundErr)
    }
    throw err
  }
}

export async function grantCredits(
  userId: string,
  credits: number,
  sessionId: string,
  eventId?: string,
): Promise<CreditStatus> {
  return asCreditStatus(
    await supabaseAdminRpc('grant_credits', {
      p_user_id: userId,
      p_credits: credits,
      p_session_id: sessionId,
      p_event_id: eventId || null,
    }),
  )
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
