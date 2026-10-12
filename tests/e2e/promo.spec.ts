import { test, expect } from './fixtures'
import {
  accountDialog,
  createAdminSession,
  loginDialog,
  manageAccountButton,
  paywallDialog,
  seedAdminSession,
} from './auth'
import { fetchProfile, fillMidtimeValuation, openApp, pane, setProfile, submitValuation, valuationResult } from './helpers'

test.describe('promo code', () => {
  test('TRADESHOW grants 25 valuations once per account', async ({ request }) => {
    const { userId, session } = await createAdminSession()
    const redeem = (code: string) =>
      request.post('/api/promo', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        data: { code },
      })

    const bad = await redeem('NOTACODE')
    expect(bad.status()).toBe(400)
    expect((await fetchProfile(userId))?.credit_balance ?? 0).toBe(0)

    const ok = await redeem('trade show')
    expect(ok.ok()).toBeTruthy()
    const body = (await ok.json()) as { credits?: number; granted?: boolean }
    expect(body.granted).toBe(true)
    expect(body.credits).toBe(25)
    expect((await fetchProfile(userId))?.credit_balance).toBe(25)

    const again = await redeem('TRADESHOW')
    expect(again.status()).toBe(409)
    expect((await fetchProfile(userId))?.credit_balance).toBe(25)
  })

  test('a code without a session is rejected', async ({ request }) => {
    const res = await request.post('/api/promo', { data: { code: 'TRADESHOW' } })
    expect(res.status()).toBe(401)
  })

  test('the code field sits under the tool tabs', async ({ page }) => {
    await openApp(page)
    const tools = page.locator('#app')
    const code = tools.getByLabel('Tradeshow or promo code')
    await expect(code).toBeVisible()
    await code.fill('TRADESHOW')
    await tools.getByRole('button', { name: 'Apply' }).click()
    await expect(loginDialog(page)).toBeVisible()
    await expect(loginDialog(page).getByLabel('Tradeshow or promo code')).toHaveValue('TRADESHOW')
    await expect(loginDialog(page).getByText('Tradeshow access is on.', { exact: true })).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('spv_tradeshow'))).toBe('TRADESHOW')
  })

  test('the sign-in dialog accepts the tradeshow code', async ({ page }) => {
    await openApp(page)
    await page.getByRole('button', { name: 'Sign In' }).click()
    const dialog = loginDialog(page)
    const code = dialog.getByLabel('Tradeshow or promo code')
    await expect(code).toBeVisible()
    await expect(code).toHaveAttribute('placeholder', 'TRADESHOW')
    await code.fill('TRADESHOW')
    await expect(dialog.getByText('Tradeshow access is on.', { exact: true })).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('spv_tradeshow'))).toBe('TRADESHOW')
    await dialog.getByRole('button', { name: 'Apply' }).click()
    await expect(dialog.getByText(/sign in with your email to run a valuation/i)).toBeVisible()
    await expect(dialog.getByLabel(/^email$/i)).toBeVisible()
    await page.reload()
    await expect(page.getByText('Tradeshow access is on.', { exact: true }).first()).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('spv_tradeshow'))).toBe('TRADESHOW')
  })

  test('an invalid code does not authorize the browser', async ({ page }) => {
    await openApp(page)
    await page.getByRole('button', { name: 'Sign In' }).click()
    const dialog = loginDialog(page)
    await dialog.getByLabel('Tradeshow or promo code').fill('NOTACODE')
    await dialog.getByRole('button', { name: 'Apply' }).click()
    await expect(dialog.getByRole('alert')).toHaveText('That code isn’t valid.')
    await expect(dialog.getByText('Tradeshow access is on.', { exact: true })).toHaveCount(0)
    expect(await page.evaluate(() => localStorage.getItem('spv_tradeshow'))).toBeNull()
  })

  test('tools code field grants valuations', async ({ page }) => {
    const { userId } = await seedAdminSession(page)
    await openApp(page)
    await expect(manageAccountButton(page)).toBeVisible({ timeout: 15_000 })
    const tools = page.locator('#app')
    await tools.getByLabel('Tradeshow or promo code').fill('TRADESHOW')
    await tools.getByRole('button', { name: 'Apply' }).click()
    await expect(tools.getByText('Tradeshow access is on. 25 valuations added.')).toBeVisible()
    expect((await fetchProfile(userId))?.credit_balance).toBe(25)
  })

  test('manage account applies the code and shows the new balance', async ({ page, consoleGuard }) => {
    consoleGuard.allow(409)
    const { userId } = await seedAdminSession(page)
    await openApp(page)
    await expect(manageAccountButton(page)).toBeVisible({ timeout: 15_000 })
    await manageAccountButton(page).click()

    const dialog = accountDialog(page)
    await dialog.getByLabel('Tradeshow or promo code').fill('tradeshow')
    await dialog.getByRole('button', { name: 'Apply' }).click()
    await expect(dialog.getByText('Tradeshow access is on. 25 valuations added.')).toBeVisible()
    await expect(dialog.getByLabel('Paid credits')).toHaveText('25')
    expect((await fetchProfile(userId))?.credit_balance).toBe(25)

    await dialog.getByLabel('Tradeshow or promo code').fill('TRADESHOW')
    await dialog.getByRole('button', { name: 'Apply' }).click()
    await expect(dialog.getByText('Tradeshow access is on.', { exact: true })).toBeVisible()
    expect((await fetchProfile(userId))?.credit_balance).toBe(25)
  })

  test('paywall code adds valuations and closes the dialog', async ({ page, consoleGuard }) => {
    consoleGuard.allow(402)
    const { userId } = await seedAdminSession(page)
    await setProfile(userId, { valuation_count: 3, credit_balance: 0 })
    await openApp(page)
    await fillMidtimeValuation(page)
    await pane(page, 'val').getByRole('button', { name: 'Get honest valuation' }).click()
    await expect(paywallDialog(page)).toBeVisible()

    await paywallDialog(page).getByLabel('Tradeshow or promo code').fill('TRADESHOW')
    await paywallDialog(page).getByRole('button', { name: 'Apply' }).click()
    await expect(paywallDialog(page)).toBeHidden()
    await expect(page.getByRole('status').filter({ hasText: '25 valuations added' })).toBeVisible()
    expect((await fetchProfile(userId))?.credit_balance).toBe(25)
  })

  test('saved tradeshow access values an account that is out of credits', async ({ page }) => {
    const { userId } = await seedAdminSession(page)
    await setProfile(userId, { valuation_count: 3, credit_balance: 0 })
    await page.addInitScript(() => localStorage.setItem('spv_tradeshow', 'TRADESHOW'))
    await openApp(page)
    await expect(page.getByText('Tradeshow access is on.', { exact: true }).first()).toBeVisible()
    await fillMidtimeValuation(page)
    await submitValuation(page)
    await expect(valuationResult(page)).toContainText('AIRCRAFT VALUATION')
    expect(await fetchProfile(userId)).toMatchObject({ valuation_count: 3, credit_balance: 0 })
  })
})
