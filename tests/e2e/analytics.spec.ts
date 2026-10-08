import { test, expect } from './fixtures'
import {
  accountDialog,
  loginDialog,
  manageAccountButton,
  paywallDialog,
  seedAdminSession,
  signInWithOtp,
} from './auth'
import { mockStripe } from './stripe'
import {
  compsResult,
  field,
  fillMidtimeValuation,
  gaEvents,
  lookupN,
  lookupResult,
  openApp,
  openTab,
  pane,
  setProfile,
  soldResult,
  submitValuation,
  waitForGaEvent,
} from './helpers'

test('logged-out valuation click fires valuation_started', async ({ page }) => {
  await openApp(page)
  await fillMidtimeValuation(page)
  await pane(page, 'val').getByRole('button', { name: 'Get honest valuation' }).click()
  await expect(loginDialog(page)).toBeVisible()
  await waitForGaEvent(page, 'valuation_started')
  const started = (await gaEvents(page)).filter((e) => e.name === 'valuation_started')
  expect(started).toHaveLength(1)
  expect(started[0].params).toMatchObject({ make: 'Cessna', model: '172S' })
  expect((await gaEvents(page)).some((e) => e.name === 'valuation_completed')).toBe(false)
})

test('signed-in valuation fires started then completed', async ({ page }) => {
  await seedAdminSession(page)
  await openApp(page)
  await fillMidtimeValuation(page)
  await submitValuation(page)
  const names = (await gaEvents(page)).map((e) => e.name)
  expect(names).toContain('valuation_started')
  expect(names).toContain('valuation_completed')
})

test('paywall fires valuation_limit_reached', async ({ page, consoleGuard }) => {
  consoleGuard.allow(402)
  const { userId } = await seedAdminSession(page)
  await setProfile(userId, { valuation_count: 3, credit_balance: 0 })
  await openApp(page)
  await fillMidtimeValuation(page)
  await pane(page, 'val').getByRole('button', { name: 'Get honest valuation' }).click()
  await expect(paywallDialog(page)).toBeVisible()
  await waitForGaEvent(page, 'valuation_limit_reached')
})

test('OTP sign-in of a new email fires sign_up', async ({ page }) => {
  await openApp(page)
  await signInWithOtp(page)
  await waitForGaEvent(page, 'sign_up')
  const names = (await gaEvents(page)).map((e) => e.name)
  expect(names).toContain('sign_up')
  expect(names).not.toContain('login')
})

test('lookup success fires view_item for the aircraft', async ({ page }) => {
  await openApp(page)
  await lookupN(page, '172SP')
  await expect(lookupResult(page)).toContainText('CESSNA')
  await waitForGaEvent(page, 'view_item')
  const view = (await gaEvents(page)).find((e) => e.name === 'view_item')
  expect(view?.params).toMatchObject({
    item_category: 'aircraft',
  })
  expect(String(view?.params.item_name || '')).toMatch(/CESSNA/i)
})

test('report-a-sale submit fires generate_lead', async ({ page }) => {
  await openApp(page)
  await openTab(page, 'sold')
  const form = pane(page, 'sold')
  await field(form, 'Aircraft make').fill('Cessna')
  await field(form, 'Model').fill('172S')
  await field(form, 'Year').fill('2004')
  await field(form, 'Sale price ($)').fill('135000')
  await form.getByRole('checkbox', { name: /I confirm this is a real transaction/ }).check()
  await form.getByRole('button', { name: 'Submit sale data' }).click()
  await expect(soldResult(page)).toContainText('Sale data submitted')
  await waitForGaEvent(page, 'generate_lead')
  const lead = (await gaEvents(page)).find((e) => e.name === 'generate_lead')
  expect(lead?.params).toMatchObject({ lead_type: 'sold_report', make: 'Cessna', model: '172S' })
})

test('marketplace listing links fire broker_contact_click', async ({ page }) => {
  await openApp(page)
  await openTab(page, 'comps')
  const form = pane(page, 'comps')
  await field(form, 'Make & model').fill('Cessna 172S')
  await form.getByRole('button', { name: 'Search asking prices' }).click()
  await expect(compsResult(page)).toContainText('Trade-A-Plane', { timeout: 20_000 })
  const popupP = page.waitForEvent('popup').catch(() => null)
  await compsResult(page).getByRole('link', { name: 'Trade-A-Plane' }).click()
  const params = await waitForGaEvent(page, 'broker_contact_click')
  expect(params).toMatchObject({ destination: 'trade-a-plane' })
  const popup = await popupP
  if (popup) await popup.close()
})

test('checkout buy fires begin_checkout', async ({ page, backendMocks }) => {
  await mockStripe(backendMocks)
  await seedAdminSession(page)
  await openApp(page)
  await expect(manageAccountButton(page)).toBeVisible({ timeout: 15_000 })
  await manageAccountButton(page).click()
  const [params] = await Promise.all([
    waitForGaEvent(page, 'begin_checkout'),
    page.waitForURL(/checkout\.stripe\.com/, { timeout: 15_000 }),
    accountDialog(page).getByRole('button', { name: '1 valuation — $24' }).click(),
  ])
  expect(params).toMatchObject({ currency: 'USD', value: 24, item_id: 'single' })
})

test('checkout return fires purchase', async ({ page }) => {
  await seedAdminSession(page)
  await openApp(page, '/?paid=1')
  await waitForGaEvent(page, 'purchase')
})
