import type { H3Event } from 'h3'
import { supabaseAdminGet, supabaseRpc } from './supabase'
import { stripeConfigured } from './stripe'

export type CreditGrantResult = {
  ok: boolean
  duplicate?: boolean
  balance: number
}

export function valuationLimitsEnabled(): boolean {
  const flag = process.env.SPV_VALUATION_LIMITS
  if (flag === 'true') return true
  if (flag === 'false') return false
  return stripeConfigured()
}

export async function getCreditBalance(clientId: string): Promise<number> {
  if (!clientId || !useRuntimeConfig().supabaseServiceRoleKey) return 0
  try {
    const rows = (await supabaseAdminGet(
      `user_credits?client_id=eq.${encodeURIComponent(clientId)}&select=balance`,
    )) as { balance?: number }[]
    if (!Array.isArray(rows) || !rows[0]) return 0
    return Number(rows[0].balance) || 0
  } catch {
    return 0
  }
}

export async function grantCredits(params: {
  clientId: string
  email?: string | null
  credits: number
  sessionId: string
  product: string
  amountCents: number
  customerId?: string | null
  eventId?: string | null
}): Promise<CreditGrantResult> {
  const result = await supabaseRpc<CreditGrantResult>('grant_valuation_credits', {
    p_client_id: params.clientId,
    p_email: params.email || null,
    p_credits: params.credits,
    p_session_id: params.sessionId,
    p_product: params.product,
    p_amount_cents: params.amountCents,
    p_customer_id: params.customerId || null,
    p_event_id: params.eventId || null,
  })
  return result || { ok: true, balance: 0 }
}

export async function consumeCredit(clientId: string): Promise<boolean> {
  const result = await supabaseRpc<{ ok?: boolean }>('consume_valuation_credit', {
    p_client_id: clientId,
  })
  return Boolean(result?.ok)
}

export async function refundCredit(clientId: string): Promise<void> {
  await supabaseRpc('refund_valuation_credit', { p_client_id: clientId })
}

export function publicSiteUrl(event: H3Event): string {
  const config = useRuntimeConfig()
  const fallback = String(config.public.siteUrl || 'https://smallplanevalue.com').replace(/\/$/, '')
  const proto = String(getHeader(event, 'x-forwarded-proto') || 'https')
  const host = String(getHeader(event, 'x-forwarded-host') || getHeader(event, 'host') || '')
  if (!host) return fallback
  if (host.includes('localhost') || host.startsWith('127.0.0.1')) {
    return `http://${host}`.replace(/\/$/, '')
  }
  if (host.includes('smallplanevalue.com') || host.includes('vercel.app')) {
    return `${proto}://${host}`.replace(/\/$/, '')
  }
  return fallback
}
