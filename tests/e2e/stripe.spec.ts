import { test, expect } from './fixtures'
import { getAnthropicValuateHits } from './anthropic'
import {
  accountDialog,
  createAdminSession,
  manageAccountButton,
  paywallDialog,
  seedAdminSession,
} from './auth'
import {
  appToast,
  fetchProfile,
  field,
  fillMidtimeValuation,
  openApp,
  openTab,
  pane,
  setProfile,
  submitValuation,
  valuationResult,
} from './helpers'
import { checkoutCompletedPayload, leaveCheckoutUnpaid, mockStripe, signStripeWebhook } from './stripe'

test.beforeEach(async ({ backendMocks }) => {
  await mockStripe(backendMocks)
})

test.describe('checkout', () => {
  test('buy single sends the user toward Stripe Checkout', async ({ page }) => {
    await seedAdminSession(page)
    await openApp(page)
    await expect(manageAccountButton(page)).toBeVisible({ timeout: 15_000 })
    await manageAccountButton(page).click()

    await Promise.all([
      page.waitForURL(/checkout\.stripe\.com/, { timeout: 15_000 }),
      accountDialog(page).getByRole('button', { name: '1 valuation — $24' }).click(),
    ])
  })

  test('paywall buy pack sends the user toward Stripe Checkout', async ({ page, consoleGuard }) => {
    consoleGuard.allow(402)
    const { userId } = await seedAdminSession(page)
    await setProfile(userId, { valuation_count: 3, credit_balance: 0 })
    await openApp(page)
    await fillMidtimeValuation(page)
    await pane(page, 'val').getByRole('button', { name: 'Get honest valuation' }).click()
    await expect(paywallDialog(page)).toBeVisible()

    await Promise.all([
      page.waitForURL(/checkout\.stripe\.com/, { timeout: 15_000 }),
      paywallDialog(page).getByRole('button', { name: '5 valuations — $75' }).click(),
    ])
  })
})

test.describe('webhook', () => {
  test('signed checkout.session.completed grants credits', async ({ request }) => {
    const { userId } = await createAdminSession()
    const payload = checkoutCompletedPayload({
      eventId: `evt_${crypto.randomUUID()}`,
      sessionId: `cs_test_${crypto.randomUUID()}`,
      userId,
      credits: 1,
    })

    const res = await request.post('/api/stripe/webhook', {
      headers: {
        'content-type': 'application/json',
        'stripe-signature': signStripeWebhook(payload),
      },
      data: payload,
    })
    expect(res.ok()).toBeTruthy()
    expect((await fetchProfile(userId))?.credit_balance).toBe(1)
  })

  test('same event or session is idempotent', async ({ request }) => {
    const { userId } = await createAdminSession()
    const eventId = `evt_${crypto.randomUUID()}`
    const sessionId = `cs_test_${crypto.randomUUID()}`
    const payload = checkoutCompletedPayload({ eventId, sessionId, userId, credits: 5 })
    const replay = async () =>
      request.post('/api/stripe/webhook', {
        headers: {
          'content-type': 'application/json',
          'stripe-signature': signStripeWebhook(payload),
        },
        data: payload,
      })

    expect((await replay()).ok()).toBeTruthy()
    expect((await replay()).ok()).toBeTruthy()

    const otherEventSameSession = checkoutCompletedPayload({
      eventId: `evt_${crypto.randomUUID()}`,
      sessionId,
      userId,
      credits: 5,
    })
    const again = await request.post('/api/stripe/webhook', {
      headers: {
        'content-type': 'application/json',
        'stripe-signature': signStripeWebhook(otherEventSameSession),
      },
      data: otherEventSameSession,
    })
    expect(again.ok()).toBeTruthy()
    expect((await fetchProfile(userId))?.credit_balance).toBe(5)
  })

  test('webhook for user B does not credit A', async ({ request }) => {
    const a = await createAdminSession()
    const b = await createAdminSession()
    const payload = checkoutCompletedPayload({
      eventId: `evt_${crypto.randomUUID()}`,
      sessionId: `cs_test_${crypto.randomUUID()}`,
      userId: b.userId,
      credits: 1,
    })
    const res = await request.post('/api/stripe/webhook', {
      headers: {
        'content-type': 'application/json',
        'stripe-signature': signStripeWebhook(payload),
      },
      data: payload,
    })
    expect(res.ok()).toBeTruthy()
    expect((await fetchProfile(a.userId))?.credit_balance ?? 0).toBe(0)
    expect((await fetchProfile(b.userId))?.credit_balance).toBe(1)
  })

  test('bad signature is 400 and does not grant', async ({ request }) => {
    const { userId } = await createAdminSession()
    const payload = checkoutCompletedPayload({
      eventId: `evt_${crypto.randomUUID()}`,
      sessionId: `cs_test_${crypto.randomUUID()}`,
      userId,
      credits: 1,
    })
    const res = await request.post('/api/stripe/webhook', {
      headers: {
        'content-type': 'application/json',
        'stripe-signature': 't=1,v1=deadbeef',
      },
      data: payload,
    })
    expect(res.status()).toBe(400)
    expect((await fetchProfile(userId))?.credit_balance ?? 0).toBe(0)
  })

  test('grant then a fourth valuation succeeds', async ({ page, request }) => {
    const { userId } = await seedAdminSession(page)
    await setProfile(userId, { valuation_count: 3, credit_balance: 0 })
    const payload = checkoutCompletedPayload({
      eventId: `evt_${crypto.randomUUID()}`,
      sessionId: `cs_test_${crypto.randomUUID()}`,
      userId,
      credits: 1,
    })
    const res = await request.post('/api/stripe/webhook', {
      headers: {
        'content-type': 'application/json',
        'stripe-signature': signStripeWebhook(payload),
      },
      data: payload,
    })
    expect(res.ok()).toBeTruthy()
    expect((await fetchProfile(userId))?.credit_balance).toBe(1)

    await openApp(page)
    await expect(manageAccountButton(page)).toBeVisible({ timeout: 15_000 })
    await fillMidtimeValuation(page)
    const before = getAnthropicValuateHits()
    await submitValuation(page)
    expect(getAnthropicValuateHits()).toBe(before + 1)

    const profile = await fetchProfile(userId)
    expect(profile?.valuation_count).toBe(4)
    expect(profile?.credit_balance).toBe(0)

    await manageAccountButton(page).click()
    await expect(accountDialog(page).getByLabel('Paid credits')).toHaveText('0')
    await expect(accountDialog(page).getByLabel('Free remaining')).toHaveText('0')
    await expect(accountDialog(page).getByLabel('Valuations run')).toHaveText('4')
  })
})

test.describe('confirm + return', () => {
  test('POST /api/stripe/confirm grants a paid session', async ({ request }) => {
    const { userId, session } = await createAdminSession()
    const created = await request.post('/api/checkout', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      data: { sku: 'single' },
    })
    expect(created.ok()).toBeTruthy()
    const body = (await created.json()) as { id?: string; url?: string }
    expect(body.id).toBeTruthy()
    expect(body.url).toMatch(/checkout\.stripe\.com/)

    const confirm = await request.post('/api/stripe/confirm', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      data: { session_id: body.id },
    })
    expect(confirm.ok()).toBeTruthy()
    expect((await fetchProfile(userId))?.credit_balance).toBe(1)
  })

  test('confirm of another account session is 403 and does not grant', async ({ request }) => {
    const a = await createAdminSession()
    const b = await createAdminSession()
    const created = await request.post('/api/checkout', {
      headers: { Authorization: `Bearer ${a.session.access_token}` },
      data: { sku: 'single' },
    })
    const { id } = (await created.json()) as { id: string }

    const confirm = await request.post('/api/stripe/confirm', {
      headers: { Authorization: `Bearer ${b.session.access_token}` },
      data: { session_id: id },
    })
    expect(confirm.status()).toBe(403)
    expect((await fetchProfile(a.userId))?.credit_balance ?? 0).toBe(0)
    expect((await fetchProfile(b.userId))?.credit_balance ?? 0).toBe(0)
  })

  test('unpaid session does not grant via confirm or webhook', async ({ request }) => {
    const { userId, session } = await createAdminSession()
    const created = await request.post('/api/checkout', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      data: { sku: 'single' },
    })
    const { id } = (await created.json()) as { id: string }
    leaveCheckoutUnpaid(id)

    const confirm = await request.post('/api/stripe/confirm', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      data: { session_id: id },
    })
    expect(confirm.ok()).toBeTruthy()
    expect(await confirm.json()).toMatchObject({ paid: false, granted: false })
    expect((await fetchProfile(userId))?.credit_balance ?? 0).toBe(0)

    const payload = checkoutCompletedPayload({
      eventId: `evt_${crypto.randomUUID()}`,
      sessionId: `cs_test_${crypto.randomUUID()}`,
      userId,
      credits: 1,
      paymentStatus: 'unpaid',
    })
    const webhook = await request.post('/api/stripe/webhook', {
      headers: {
        'content-type': 'application/json',
        'stripe-signature': signStripeWebhook(payload),
      },
      data: payload,
    })
    expect(webhook.ok()).toBeTruthy()
    expect((await fetchProfile(userId))?.credit_balance ?? 0).toBe(0)
  })

  test('webhook then confirm on the same session grants once', async ({ request }) => {
    const { userId, session } = await createAdminSession()
    const created = await request.post('/api/checkout', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      data: { sku: 'pack' },
    })
    const { id } = (await created.json()) as { id: string }
    const payload = checkoutCompletedPayload({
      eventId: `evt_${crypto.randomUUID()}`,
      sessionId: id,
      userId,
      credits: 5,
    })
    const webhook = await request.post('/api/stripe/webhook', {
      headers: {
        'content-type': 'application/json',
        'stripe-signature': signStripeWebhook(payload),
      },
      data: payload,
    })
    expect(webhook.ok()).toBeTruthy()
    expect((await fetchProfile(userId))?.credit_balance).toBe(5)

    const confirm = await request.post('/api/stripe/confirm', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      data: { session_id: id },
    })
    expect(confirm.ok()).toBeTruthy()
    expect((await fetchProfile(userId))?.credit_balance).toBe(5)
  })

  test('success return keeps the form, confirms credits, and does not auto-submit', async ({
    page,
    request,
  }) => {
    const { userId, session } = await seedAdminSession(page)
    await openApp(page)
    await fillMidtimeValuation(page, { notes: 'Keep me after checkout' })

    const created = await request.post('/api/checkout', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      data: { sku: 'pack' },
    })
    const { id } = (await created.json()) as { id: string }

    await openApp(page, `/?tab=val&paid=1&session_id=${id}`)
    await openTab(page, 'val')
    await expect(field(pane(page, 'val'), 'Make')).toHaveValue('Cessna')
    await expect(field(pane(page, 'val'), 'Model')).toHaveValue('172S')
    await expect(field(pane(page, 'val'), 'Engine SMOH (hrs)')).toHaveValue('1000')
    await expect(field(pane(page, 'val'), /^notes/i)).toHaveValue('Keep me after checkout')
    await expect(valuationResult(page)).not.toContainText('AIRCRAFT VALUATION')
    await expect(appToast(page)).toContainText(/credits added/i)

    await expect.poll(async () => (await fetchProfile(userId))?.credit_balance).toBe(5)
  })

  test('cancel return keeps the form, does not grant, and does not auto-submit', async ({
    page,
  }) => {
    const { userId } = await seedAdminSession(page)
    await openApp(page)
    await fillMidtimeValuation(page, { notes: 'Keep me after cancel' })

    await openApp(page, '/?tab=val&paid=0')
    await openTab(page, 'val')
    await expect(field(pane(page, 'val'), 'Make')).toHaveValue('Cessna')
    await expect(field(pane(page, 'val'), 'Model')).toHaveValue('172S')
    await expect(field(pane(page, 'val'), 'Engine SMOH (hrs)')).toHaveValue('1000')
    await expect(field(pane(page, 'val'), /^notes/i)).toHaveValue('Keep me after cancel')
    await expect(valuationResult(page)).not.toContainText('AIRCRAFT VALUATION')
    await expect(appToast(page)).toContainText(/checkout canceled/i)
    expect((await fetchProfile(userId))?.credit_balance ?? 0).toBe(0)
  })
})
