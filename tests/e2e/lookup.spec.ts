import { test, expect } from '@playwright-backend-mocks/playwright'
import { mockAnthropic } from './anthropic'
import { expectAlert, lookupN, openApp, openTab } from './helpers'

test.beforeEach(async ({ page, backendMocks }) => {
  await mockAnthropic(backendMocks)
  await openApp(page)
})

test('seeded 172SP renders the FAA record from local Supabase', async ({ page }) => {
  await lookupN(page, '172SP')
  const result = page.locator('#nn-result')
  await expect(result).toContainText('CESSNA')
  await expect(result).toContainText('172S')
  await expect(result).toContainText('LOCAL DEV')
  await expect(result).toContainText('LYCOMING')
  await expect(result).toContainText('Registration current')
})

test('example N-number chip 172SP triggers a lookup', async ({ page }) => {
  await page.getByRole('button', { name: '172SP' }).click()
  await expect(page.locator('#nn-result')).toContainText('CESSNA')
  await expect(page.locator('#nn-result')).toContainText('172S')
})

test('seeded 22T renders Cirrus SR22T', async ({ page }) => {
  await lookupN(page, '22T')
  const result = page.locator('#nn-result')
  await expect(result).toContainText('CIRRUS')
  await expect(result).toContainText('SR22T')
  await expect(result).toContainText('CONTINENTAL')
})

test('seeded 182RG renders Cessna R182', async ({ page }) => {
  await lookupN(page, '182RG')
  const result = page.locator('#nn-result')
  await expect(result).toContainText('CESSNA')
  await expect(result).toContainText('R182')
})

test('seeded 58P renders Beech 58P', async ({ page }) => {
  await lookupN(page, '58P')
  const result = page.locator('#nn-result')
  await expect(result).toContainText('BEECH')
  await expect(result).toContainText('58P')
  await expect(result).toContainText('multi', { ignoreCase: true })
})

test('unknown N-number shows the not-found state', async ({ page }) => {
  await lookupN(page, 'ZZZZZ')
  const result = page.locator('#nn-result')
  await expect(result).toContainText('No aircraft found')
  await expect(result).toContainText('NZZZZZ')
  await expect(result.getByRole('link', { name: /search FAA directly/i })).toBeVisible()
})

test('empty N-number alerts the user', async ({ page }) => {
  await expectAlert(page, () => page.locator('#nn-btn').click({ force: true }), 'Enter an N-number.')
})

test('deep link ?n=172SP auto-looks up the aircraft', async ({ page }) => {
  await openApp(page, '/?n=172SP')
  await expect(page.locator('#pane-lookup')).toHaveClass(/active/)
  await expect(page.locator('#nn')).toHaveValue('172SP')
  await expect(page.locator('#nn-result')).toContainText('CESSNA', { timeout: 15_000 })
  await expect(page.locator('#nn-result')).toContainText('172S')
})

test('lookup Get valuation prefills make, model, year, and engine', async ({ page }) => {
  await lookupN(page, '172SP')
  await expect(page.locator('#nn-result')).toContainText('CESSNA')
  await page.locator('#nn-result').getByRole('button', { name: 'Get valuation' }).click()
  await expect(page.locator('#pane-val')).toHaveClass(/active/)
  await expect(page.locator('#v-make')).toHaveValue('CESSNA')
  await expect(page.locator('#v-model')).toHaveValue('172S')
  await expect(page.locator('#v-year')).toHaveValue('2005')
  await expect(page.locator('#v-engine-display')).toHaveValue(/LYCOMING\s+IO-360-L2A/)
})

test('lookup Pre-buy checklist prefills make, model, and year', async ({ page }) => {
  await lookupN(page, '172SP')
  await expect(page.locator('#nn-result')).toContainText('CESSNA')
  await page.locator('#nn-result').getByRole('button', { name: 'Pre-buy checklist' }).click()
  await expect(page.locator('#pane-checklist')).toHaveClass(/active/)
  await expect(page.locator('#cl-make')).toHaveValue('CESSNA')
  await expect(page.locator('#cl-model')).toHaveValue('172S')
  await expect(page.locator('#cl-year')).toHaveValue('2005')
})

test('lookup of twin 58P switches the valuation form to twin fields', async ({ page }) => {
  await lookupN(page, '58P')
  await expect(page.locator('#nn-result')).toContainText('BEECH')
  await openTab(page, 'val')
  await expect(page.locator('#v-engines')).toHaveValue('2')
  await expect(page.locator('#twin-eng-fields')).toBeVisible()
  await expect(page.locator('#v-smoh-l')).toBeVisible()
  await expect(page.locator('#v-smoh-r')).toBeVisible()
})

test('unseeded example chip RV10 shows not-found', async ({ page }) => {
  await page.getByRole('button', { name: 'RV10' }).click()
  await expect(page.locator('#nn-result')).toContainText('No aircraft found')
})
