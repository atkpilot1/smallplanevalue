import { createHmac } from 'node:crypto'
import type { BackendMocks } from '@playwright-backend-mocks/playwright'

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''
if (!STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET is required (loaded from .env.test in Playwright).')
}

type StoredSession = {
  id: string
  object: 'checkout.session'
  url: string
  payment_status: string
  status: string
  mode: string
  metadata: { user_id: string; credits: string }
  client_reference_id: string
}

const sessions = new Map<string, StoredSession>()
const unpaidOnRetrieve = new Set<string>()

/** Keep a created session unpaid on retrieve (default retrieve looks paid, like a Checkout return). */
export function leaveCheckoutUnpaid(sessionId: string) {
  unpaidOnRetrieve.add(sessionId)
}

export function signStripeWebhook(
  payload: string,
  secret = STRIPE_WEBHOOK_SECRET,
  timestamp = Math.floor(Date.now() / 1000),
) {
  const v1 = createHmac('sha256', secret).update(`${timestamp}.${payload}`, 'utf8').digest('hex')
  return `t=${timestamp},v1=${v1}`
}

export function checkoutCompletedPayload(opts: {
  eventId: string
  sessionId: string
  userId: string
  credits: number
  paymentStatus?: string
}) {
  return JSON.stringify({
    id: opts.eventId,
    object: 'event',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: opts.sessionId,
        object: 'checkout.session',
        payment_status: opts.paymentStatus ?? 'paid',
        client_reference_id: opts.userId,
        metadata: {
          user_id: opts.userId,
          credits: String(opts.credits),
        },
      },
    },
  })
}

export async function mockStripe(backendMocks: BackendMocks) {
  sessions.clear()
  unpaidOnRetrieve.clear()
  await backendMocks.route('https://api.stripe.com/**', async (route, request) => {
    const url = new URL(request.url())
    const path = url.pathname
    const method = request.method()

    if (method === 'POST' && path === '/v1/checkout/sessions') {
      const params = new URLSearchParams(request.postData() || '')
      const userId = params.get('metadata[user_id]') || params.get('client_reference_id') || ''
      const credits = params.get('metadata[credits]') || '1'
      const id = `cs_test_${crypto.randomUUID()}`
      const session: StoredSession = {
        id,
        object: 'checkout.session',
        url: `https://checkout.stripe.com/c/pay/${id}`,
        payment_status: 'unpaid',
        status: 'open',
        mode: 'payment',
        metadata: { user_id: userId, credits },
        client_reference_id: userId,
      }
      sessions.set(id, session)
      await route.fulfill({ status: 200, contentType: 'application/json', json: session })
      return
    }

    const getMatch = path.match(/^\/v1\/checkout\/sessions\/([^/]+)$/)
    if (method === 'GET' && getMatch) {
      const id = decodeURIComponent(getMatch[1])
      const stored = sessions.get(id)
      if (!stored) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          json: { error: { type: 'invalid_request_error', message: 'No such checkout session' } },
        })
        return
      }
      const paid = !unpaidOnRetrieve.has(id)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          ...stored,
          payment_status: paid ? 'paid' : 'unpaid',
          status: paid ? 'complete' : 'open',
        },
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: { object: 'list', data: [] },
    })
  })
}
