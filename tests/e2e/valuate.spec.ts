import { test, expect } from '@playwright-backend-mocks/playwright'
import { failAnthropic, mockAnthropic } from './anthropic'
import {
  AI_BASELINE,
  checkAvionics,
  openAvionics,
  expectAlert,
  expectValuationDollars,
  fetchUsageEvents,
  fillMidtimeValuation,
  field,
  fillValuation,
  lookupN,
  lookupResult,
  openApp,
  openTab,
  pane,
  submitValuation,
  usd,
  valuationResult,
} from './helpers'

test.beforeEach(async ({ page, backendMocks }) => {
  await mockAnthropic(backendMocks)
  await openApp(page)
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

test('parse listing failure alerts the user', async ({ page }) => {
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

test('Anthropic 500 surfaces a valuation failure', async ({ page }) => {
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
