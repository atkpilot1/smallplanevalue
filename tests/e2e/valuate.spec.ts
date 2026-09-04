import { test, expect } from './fixtures'
import { failAnthropic, getAnthropicValuateHits, mockAnthropic } from './anthropic'
import {
  accountDialog,
  createAdminSession,
  fetchOtp,
  loginDialog,
  manageAccountButton,
  paywallDialog,
  requestOtp,
  seedAdminSession,
  uniqueTestEmail,
} from './auth'
import {
  AI_BASELINE,
  checkAvionics,
  openAvionics,
  expectAlert,
  expectValuationDollars,
  fetchProfile,
  fetchUsageEvents,
  fillMidtimeValuation,
  field,
  fillValuation,
  lookupN,
  lookupResult,
  openApp,
  openTab,
  pane,
  setProfile,
  submitValuation,
  usd,
  valuationResult,
} from './helpers'

test.beforeEach(async ({ page, backendMocks }) => {
  await mockAnthropic(backendMocks)
})

test.describe('login required', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page)
  })

  test('anonymous POST /api/valuate is 401', async ({ request }) => {
    const res = await request.post('/api/valuate', {
      data: { make: 'Cessna', model: '172S', year: '2004' },
    })
    expect(res.status()).toBe(401)
    const body = (await res.json()) as { statusMessage?: string; message?: string }
    expect(`${body.statusMessage || ''} ${body.message || ''}`).toMatch(/sign in/i)
  })

  test('invalid bearer token is 401', async ({ request }) => {
    const res = await request.post('/api/valuate', {
      headers: { Authorization: 'Bearer not-a-real-token' },
      data: { make: 'Cessna', model: '172S', year: '2004' },
    })
    expect(res.status()).toBe(401)
  })

  test('logged-out submit opens sign-in and does not POST /api/valuate', async ({ page }) => {
    await fillMidtimeValuation(page)
    const valuatePosts: string[] = []
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/api/valuate')) {
        valuatePosts.push(req.url())
      }
    })
    await pane(page, 'val').getByRole('button', { name: 'Get honest valuation' }).click()
    await expect(loginDialog(page)).toBeVisible()
    await expect(valuationResult(page)).not.toContainText('AIRCRAFT VALUATION')
    expect(valuatePosts).toEqual([])
  })

  test('OTP from the valuation dialog then a second submit values', async ({ page }) => {
    await fillMidtimeValuation(page)
    await pane(page, 'val').getByRole('button', { name: 'Get honest valuation' }).click()
    await expect(loginDialog(page)).toBeVisible()

    const email = uniqueTestEmail()
    await requestOtp(page, email)
    const code = await fetchOtp(email)
    const dialog = loginDialog(page)
    await dialog.getByLabel(/verification code/i).fill(code)
    await dialog.getByRole('button', { name: /^verify$/i }).click()
    await expect(manageAccountButton(page)).toBeVisible({ timeout: 15_000 })
    await expect(dialog).toBeHidden()

    await expect(field(pane(page, 'val'), 'Make')).toHaveValue('Cessna')
    await expect(field(pane(page, 'val'), 'Model')).toHaveValue('172S')
    await expect(valuationResult(page)).not.toContainText('AIRCRAFT VALUATION')

    await submitValuation(page)
  })
})

test.describe('signed in', () => {
  let account: { email: string; userId: string }

  test.beforeEach(async ({ page }) => {
    account = await seedAdminSession(page)
    await openApp(page)
    await expect(manageAccountButton(page)).toBeVisible({ timeout: 15_000 })
  })

test('parse listing auto-fills identity, times, and G1000', async ({ page }) => {
  await openTab(page, 'val')
  const form = pane(page, 'val')
  await field(form, 'Paste a listing').fill('2004 Cessna 172S, 3200 TTAF, G1000, no damage history')
  await form.getByRole('button', { name: 'Auto-fill from listing' }).click()
  await expect(field(form, 'Make')).toHaveValue('Cessna')
  await expect(field(form, 'Model')).toHaveValue('172S')
  await expect(field(form, 'Year')).toHaveValue('2004')
  await expect(field(form, /total time/i)).toHaveValue('3200')
  await expect(field(form, 'Engine SMOH (hrs)')).toHaveValue('850')
  await openAvionics(page)
  await expect(form.getByRole('checkbox', { name: 'G1000', exact: true })).toBeChecked()
})

test('parse listing failure alerts the user', async ({ page, consoleGuard }) => {
  consoleGuard.allow(500, /Parse failed/)
  failAnthropic('listing')
  await openTab(page, 'val')
  const form = pane(page, 'val')
  await field(form, 'Paste a listing').fill('not a real listing')
  await expectAlert(
    page,
    () => form.getByRole('button', { name: 'Auto-fill from listing' }).click(),
    'Could not parse listing',
  )
})

test('missing SMOH applies a fresh-engine premium of $23k', async ({ page }) => {
  await fillValuation(page, { make: 'Cessna', model: '172S', year: '2004' })
  await submitValuation(page)
  await expectValuationDollars(page, 318_000, 343_000, 303_000)
  await expect(valuationResult(page)).toContainText('Engine time premium')
})

test('mid-time SMOH leaves the AI baseline unchanged', async ({ page }) => {
  await fillMidtimeValuation(page)
  await submitValuation(page)
  await expectValuationDollars(
    page,
    AI_BASELINE.fairMarketValue,
    AI_BASELINE.sellerAsk,
    AI_BASELINE.buyerTarget,
  )
})

test('out of annual deducts a flat $50k', async ({ page }) => {
  await fillMidtimeValuation(page, { outOfAnnual: true })
  await submitValuation(page)
  await expectValuationDollars(page, 245_000, 270_000, 230_000)
})

test('avionics panel package adds package dollars when no boxes are checked', async ({ page }) => {
  await fillMidtimeValuation(page, {
    avionicsPackage: 'Modern Garmin suite (GTN + glass + GFC autopilot)',
  })
  await submitValuation(page)
  await expectValuationDollars(page, 340_000, 365_000, 325_000)
  await expect(valuationResult(page)).toContainText('+$45,000')
  await expect(valuationResult(page)).toContainText('Modern Garmin suite')
})

test('itemized avionics skip the panel-package dollar add', async ({ page }) => {
  await fillMidtimeValuation(page, {
    avionicsPackage: 'Modern Garmin suite (GTN + glass + GFC autopilot)',
  })
  await checkAvionics(page, 'G1000')
  await submitValuation(page)
  await expectValuationDollars(
    page,
    AI_BASELINE.fairMarketValue,
    AI_BASELINE.sellerAsk,
    AI_BASELINE.buyerTarget,
  )
  await expect(valuationResult(page)).not.toContainText('+$45,000')
})

test('missing logbooks apply a −18% records adjustment', async ({ page }) => {
  await fillMidtimeValuation(page, { logbooks: 'Missing / incomplete' })
  await submitValuation(page)
  await expectValuationDollars(page, 242_000, 262_000, 230_000)
  await expect(valuationResult(page)).toContainText('Records deduction')
  await expect(valuationResult(page)).toContainText('incomplete/missing logbooks')
  await expect(valuationResult(page)).toContainText('-18% records')
})

test('complete logs and clean damage apply a +7% records premium', async ({ page }) => {
  await fillMidtimeValuation(page, {
    logbooks: 'Complete since new',
    damage: 'None (clean, verified)',
  })
  await submitValuation(page)
  await expectValuationDollars(page, 316_000, 342_000, 300_000)
  await expect(valuationResult(page)).toContainText('Records premium')
  await expect(valuationResult(page)).toContainText('+7% records')
})

test('major documented damage applies a −12% records adjustment', async ({ page }) => {
  await fillMidtimeValuation(page, { damage: 'Repaired, major (documented)' })
  await submitValuation(page)
  await expectValuationDollars(page, 260_000, 282_000, 246_000)
  await expect(valuationResult(page)).toContainText('Records deduction')
  await expect(valuationResult(page)).toContainText('damage history')
  await expect(valuationResult(page)).toContainText('-12% records')
})

test('twin mid-time engines leave the AI baseline unchanged', async ({ page }) => {
  await fillValuation(page, {
    make: 'Beech',
    model: '58P',
    year: '1981',
    engines: '2',
    smohL: '1000',
    smohR: '1000',
  })
  await expect(field(pane(page, 'val'), 'Left engine SMOH (hrs)')).toBeVisible()
  await submitValuation(page)
  await expectValuationDollars(
    page,
    AI_BASELINE.fairMarketValue,
    AI_BASELINE.sellerAsk,
    AI_BASELINE.buyerTarget,
  )
})

test('IO-550 conversion on a pre-1996 Bonanza adds the STC premium', async ({ page }) => {
  await fillValuation(page, {
    make: 'Beech',
    model: 'A36',
    year: '1990',
    smoh: '1000',
    conversion: 'IO-550 conversion',
  })
  await expect(page.getByTestId('engine-tbo-note')).toContainText(/IO-550|TBO/i, { timeout: 10_000 })
  await submitValuation(page)
  // Mid-time engine adj is $0. STC premium at 50% life: $26,500 → $27,000.
  await expectValuationDollars(page, 322_000, 347_000, 307_000)
  await expect(valuationResult(page)).toContainText('IO-550 conversion')
  await expect(valuationResult(page)).toContainText('+$27,000')
})

test('equipped F33A below the market floor is lifted to the 2025-2026 band', async ({ page }) => {
  await fillMidtimeValuation(page, {
    make: 'Beech',
    model: 'F33A',
    year: '1985',
    notes: 'GTN 750, G500, GFC 500',
  })
  await submitValuation(page)
  await expectValuationDollars(page, 330_000, 345_000, 310_000)
  await expect(valuationResult(page)).toContainText('Market calibration applied for equipped F33A')
})

test('Cirrus make/model reveals the generation selector', async ({ page }) => {
  await fillValuation(page, { make: 'Cirrus', model: 'SR22T', year: '2018', smoh: '1000' })
  const gen = field(pane(page, 'val'), 'Cirrus generation')
  await expect(gen).toBeVisible()
  await expect(gen).toHaveValue('G6')
  await submitValuation(page)
  await expect(valuationResult(page)).toContainText('AIRCRAFT VALUATION')
})

test('asking price renders the listing-vs-market narrative', async ({ page }) => {
  await fillMidtimeValuation(page, { asking: '400000' })
  await submitValuation(page)
  await expect(valuationResult(page)).toContainText('Listing ask')
  await expect(valuationResult(page)).toContainText(usd(400_000))
  await expect(valuationResult(page)).toContainText('above our fair market value')
})

test('empty make and model alerts the user', async ({ page }) => {
  await openTab(page, 'val')
  await expectAlert(
    page,
    () => pane(page, 'val').getByRole('button', { name: 'Get honest valuation' }).click({ force: true }),
    'Enter make and model.',
  )
})

test('Anthropic 500 surfaces a valuation failure', async ({ page, consoleGuard }) => {
  consoleGuard.allow(502, /Valuation error/)
  failAnthropic('valuate')
  await fillMidtimeValuation(page)
  await pane(page, 'val').getByRole('button', { name: 'Get honest valuation' }).click()
  await expect(valuationResult(page)).toContainText('Failed:', { timeout: 20_000 })
})

test('successful valuation writes clientId and a usage_events row', async ({ page }) => {
  await fillMidtimeValuation(page)
  await submitValuation(page)
  const clientId = await page.evaluate(() => localStorage.getItem('spv_client_id'))
  expect(clientId).toBeTruthy()
  const rows = await fetchUsageEvents(clientId as string)
  expect(rows.length).toBeGreaterThan(0)
  expect(rows[0].feature).toBe('valuate')
  expect(rows[0].user_id).toBe(account.userId)
  expect(rows[0].metadata).toMatchObject({ make: 'Cessna', model: '172S' })
})

test('lookup 172SP then value uses the IO-360 overhaul cost', async ({ page }) => {
  await lookupN(page, '172SP')
  await expect(lookupResult(page)).toContainText('CESSNA')
  await lookupResult(page).getByRole('button', { name: 'Get valuation' }).click()
  await expect(field(pane(page, 'val'), 'Engine')).toHaveValue(/IO-360-L2A/)
  await expect(page.getByTestId('engine-tbo-note')).toContainText('IO-360', { timeout: 10_000 })
  await submitValuation(page)
  // Empty SMOH → 0 hrs. IO-360 overhaul $36k / 2 = $18k fresh premium.
  await expectValuationDollars(page, 313_000, 338_000, 298_000)
  await expect(valuationResult(page)).toContainText('Engine time premium')
})

test('engine life bar appears after entering SMOH', async ({ page }) => {
  await fillMidtimeValuation(page)
  const life = page.getByTestId('engine-life')
  await expect(life).toContainText('life remaining', { timeout: 10_000 })
  await expect(life).toContainText('50%')
})
})

test.describe('valuation counter', () => {
  test('successful valuations increment profiles.valuation_count', async ({ page }) => {
    const { userId } = await seedAdminSession(page)
    await openApp(page)
    await expect(manageAccountButton(page)).toBeVisible({ timeout: 15_000 })
    expect((await fetchProfile(userId))?.valuation_count ?? 0).toBe(0)

    await fillMidtimeValuation(page)
    await submitValuation(page)
    expect((await fetchProfile(userId))?.valuation_count).toBe(1)

    await submitValuation(page)
    expect((await fetchProfile(userId))?.valuation_count).toBe(2)

    await manageAccountButton(page).click()
    await expect(accountDialog(page).getByLabel('Valuations run')).toHaveText('2')
    await expect(accountDialog(page).getByLabel('Free remaining')).toHaveText('1')
    await expect(accountDialog(page).getByLabel('Paid credits')).toHaveText('0')
  })

  test('Anthropic 500 does not increment the account counter', async ({ page, consoleGuard }) => {
    consoleGuard.allow(502, /Valuation error/)
    const { userId } = await seedAdminSession(page)
    await openApp(page)
    await expect(manageAccountButton(page)).toBeVisible({ timeout: 15_000 })

    failAnthropic('valuate')
    await fillMidtimeValuation(page)
    await pane(page, 'val').getByRole('button', { name: 'Get honest valuation' }).click()
    await expect(valuationResult(page)).toContainText('Failed:', { timeout: 20_000 })
    expect((await fetchProfile(userId))?.valuation_count ?? 0).toBe(0)
  })

  test('accounts have independent valuation counters', async ({ request }) => {
    const a = await createAdminSession()
    const b = await createAdminSession()
    const body = { make: 'Cessna', model: '172S', year: '2004' }

    const post = (token: string) =>
      request.post('/api/valuate', {
        headers: { Authorization: `Bearer ${token}` },
        data: body,
      })

    expect((await post(a.session.access_token)).ok()).toBeTruthy()
    expect((await post(a.session.access_token)).ok()).toBeTruthy()
    expect((await post(b.session.access_token)).ok()).toBeTruthy()

    expect((await fetchProfile(a.userId))?.valuation_count).toBe(2)
    expect((await fetchProfile(b.userId))?.valuation_count).toBe(1)
  })
})

test.describe('credit gate', () => {
  test('three free valuations then the fourth is 402 and skips Anthropic', async ({ page, consoleGuard }) => {
    consoleGuard.allow(402)
    const { userId } = await seedAdminSession(page)
    await openApp(page)
    await expect(manageAccountButton(page)).toBeVisible({ timeout: 15_000 })
    await fillMidtimeValuation(page)

    await submitValuation(page)
    await submitValuation(page)
    await submitValuation(page)
    expect((await fetchProfile(userId))?.valuation_count).toBe(3)

    const before = getAnthropicValuateHits()
    const resP = page.waitForResponse((r) => r.url().includes('/api/valuate') && r.request().method() === 'POST')
    await pane(page, 'val').getByRole('button', { name: 'Get honest valuation' }).click()
    const res = await resP
    expect(res.status()).toBe(402)
    expect(getAnthropicValuateHits()).toBe(before)
    await expect(paywallDialog(page)).toBeVisible()
    await expect(paywallDialog(page)).toContainText(/3 free valuations/i)
    await expect(paywallDialog(page).getByRole('button', { name: '1 valuation — $24' })).toBeVisible()
    await expect(paywallDialog(page).getByRole('button', { name: '5 valuations — $75' })).toBeVisible()
    await expect(valuationResult(page)).not.toContainText('Failed:')
    expect((await fetchProfile(userId))?.valuation_count).toBe(3)
  })

  test('Anthropic 500 on the third free does not consume', async ({ page, consoleGuard }) => {
    consoleGuard.allow(502, /Valuation error/)
    const { userId } = await seedAdminSession(page)
    await setProfile(userId, { valuation_count: 2, credit_balance: 0 })
    await openApp(page)
    await expect(manageAccountButton(page)).toBeVisible({ timeout: 15_000 })

    failAnthropic('valuate')
    await fillMidtimeValuation(page)
    await pane(page, 'val').getByRole('button', { name: 'Get honest valuation' }).click()
    await expect(valuationResult(page)).toContainText('Failed:', { timeout: 20_000 })
    expect((await fetchProfile(userId))?.valuation_count).toBe(2)
    expect((await fetchProfile(userId))?.credit_balance ?? 0).toBe(0)
  })

  test('paid credit is consumed after the free three', async ({ page }) => {
    const { userId } = await seedAdminSession(page)
    await setProfile(userId, { valuation_count: 3, credit_balance: 1 })
    await openApp(page)
    await expect(manageAccountButton(page)).toBeVisible({ timeout: 15_000 })
    await fillMidtimeValuation(page)
    await submitValuation(page)

    const profile = await fetchProfile(userId)
    expect(profile?.valuation_count).toBe(4)
    expect(profile?.credit_balance).toBe(0)
  })

  test('no paid credits after the free three opens the paywall', async ({ page, consoleGuard }) => {
    consoleGuard.allow(402)
    const { userId } = await seedAdminSession(page)
    await setProfile(userId, { valuation_count: 3, credit_balance: 0 })
    await openApp(page)
    await expect(manageAccountButton(page)).toBeVisible({ timeout: 15_000 })
    await fillMidtimeValuation(page)

    const before = getAnthropicValuateHits()
    await pane(page, 'val').getByRole('button', { name: 'Get honest valuation' }).click()
    await expect(paywallDialog(page)).toBeVisible()
    await expect(valuationResult(page)).not.toContainText('AIRCRAFT VALUATION')
    expect(getAnthropicValuateHits()).toBe(before)
    expect((await fetchProfile(userId))?.valuation_count).toBe(3)
  })

  test('accounts have independent free and paid balances', async ({ request }) => {
    const a = await createAdminSession()
    const b = await createAdminSession()
    await setProfile(a.userId, { valuation_count: 3, credit_balance: 1 })
    await setProfile(b.userId, { valuation_count: 3, credit_balance: 0 })
    const body = { make: 'Cessna', model: '172S', year: '2004' }

    const post = (token: string) =>
      request.post('/api/valuate', {
        headers: { Authorization: `Bearer ${token}` },
        data: body,
      })

    expect((await post(a.session.access_token)).ok()).toBeTruthy()
    expect((await post(b.session.access_token)).status()).toBe(402)

    expect(await fetchProfile(a.userId)).toMatchObject({ valuation_count: 4, credit_balance: 0 })
    expect(await fetchProfile(b.userId)).toMatchObject({ valuation_count: 3, credit_balance: 0 })
  })
})

test.describe('valuation form persist', () => {
  test('reload restores filled fields from localStorage', async ({ page }) => {
    await openApp(page)
    await fillValuation(page, {
      make: 'Cessna',
      model: '172S',
      year: '2004',
      smoh: '850',
      asking: '189000',
      notes: 'Hangared, no damage',
      outOfAnnual: true,
      logbooks: 'Complete since new',
    })
    await checkAvionics(page, 'G1000')

    const stored = JSON.parse(
      (await page.evaluate(() => localStorage.getItem('spv_valuation_form'))) || 'null',
    ) as { make?: string; avChecked?: Record<string, boolean> } | null
    expect(stored).toMatchObject({
      make: 'Cessna',
      model: '172S',
      year: '2004',
      smoh: '850',
      asking: '189000',
      notes: 'Hangared, no damage',
      outOfAnnual: true,
      logbooks: 'Complete since new',
    })
    expect(stored?.avChecked?.['av-g1000']).toBe(true)

    await page.reload({ waitUntil: 'domcontentloaded' })
    await openTab(page, 'val')
    const form = pane(page, 'val')
    await expect(field(form, 'Make')).toHaveValue('Cessna')
    await expect(field(form, 'Model')).toHaveValue('172S')
    await expect(field(form, 'Year')).toHaveValue('2004')
    await expect(field(form, 'Engine SMOH (hrs)')).toHaveValue('850')
    await expect(field(form, 'Asking price ($)')).toHaveValue('189000')
    await expect(field(form, /^notes/i)).toHaveValue('Hangared, no damage')
    await expect(form.getByRole('checkbox', { name: 'Out of annual' })).toBeChecked()
    await expect(field(form, 'Logbooks')).toHaveValue('Complete since new')
    await openAvionics(page)
    await expect(form.getByRole('checkbox', { name: 'G1000', exact: true })).toBeChecked()
    await expect(valuationResult(page)).not.toContainText('AIRCRAFT VALUATION')
  })

  test('Checkout-style return keeps the form and does not auto-submit', async ({ page }) => {
    await openApp(page)
    await fillMidtimeValuation(page, { notes: 'Keep me after checkout' })
    await openApp(page, '/?paid=1')
    await openTab(page, 'val')
    await expect(field(pane(page, 'val'), 'Make')).toHaveValue('Cessna')
    await expect(field(pane(page, 'val'), 'Model')).toHaveValue('172S')
    await expect(field(pane(page, 'val'), 'Engine SMOH (hrs)')).toHaveValue('1000')
    await expect(field(pane(page, 'val'), /^notes/i)).toHaveValue('Keep me after checkout')
    await expect(valuationResult(page)).not.toContainText('AIRCRAFT VALUATION')
    await expect(page.getByRole('status')).toContainText(/credits added/i)
  })

  test('lookup prefill survives reload', async ({ page }) => {
    await openApp(page)
    await lookupN(page, '172SP')
    await lookupResult(page).getByRole('button', { name: 'Get valuation' }).click()
    await expect(field(pane(page, 'val'), 'Make')).toHaveValue('CESSNA')
    await expect(field(pane(page, 'val'), 'Engine')).toHaveValue(/LYCOMING\s+IO-360-L2A/)

    await page.reload({ waitUntil: 'domcontentloaded' })
    await openTab(page, 'val')
    await expect(field(pane(page, 'val'), 'Make')).toHaveValue('CESSNA')
    await expect(field(pane(page, 'val'), 'Model')).toHaveValue('172S')
    await expect(field(pane(page, 'val'), 'Year')).toHaveValue('2005')
    await expect(field(pane(page, 'val'), 'Engine')).toHaveValue(/LYCOMING\s+IO-360-L2A/)
  })
})
