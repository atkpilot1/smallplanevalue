import { test, expect } from '@playwright-backend-mocks/playwright'
import { failAnthropic, mockAnthropic } from './anthropic'
import { expectAlert, lookupN, openApp, openTab } from './helpers'

test.beforeEach(async ({ page, backendMocks }) => {
  await mockAnthropic(backendMocks)
  await openApp(page)
})

test('search renders asking ranges and days listed', async ({ page }) => {
  await openTab(page, 'comps')
  await page.locator('#c-model').fill('Cessna 172S')
  await page.locator('#c-btn').click()
  const result = page.locator('#c-result')
  await expect(result).toContainText('$295,000', { timeout: 20_000 })
  await expect(result).toContainText('$250,000')
  await expect(result).toContainText('$360,000')
  await expect(result).toContainText('45d')
  await expect(result).toContainText('Most sell within 5% of asking')
  await expect(result).toContainText('2004')
  await expect(result).toContainText('Good')
})

test('lookup prefills the comps make/model field', async ({ page }) => {
  await lookupN(page, '172SP')
  await expect(page.locator('#nn-result')).toContainText('CESSNA')
  await openTab(page, 'comps')
  await expect(page.locator('#c-model')).toHaveValue('CESSNA 172S')
})

test('empty model alerts the user', async ({ page }) => {
  await openTab(page, 'comps')
  await expectAlert(page, () => page.locator('#c-btn').click({ force: true }), 'Enter a make and model.')
})

test('year-band select still returns listing ranges', async ({ page }) => {
  await openTab(page, 'comps')
  await page.locator('#c-model').fill('Cessna 172S')
  await page.locator('#c-years').selectOption({ label: '2015 – present' })
  await page.locator('#c-btn').click()
  await expect(page.locator('#c-result')).toContainText('$295,000', { timeout: 20_000 })
})

test('Anthropic 500 surfaces a comps failure', async ({ page }) => {
  failAnthropic('comps')
  await openTab(page, 'comps')
  await page.locator('#c-model').fill('Cessna 172S')
  await page.locator('#c-btn').click()
  await expect(page.locator('#c-result')).toContainText('Failed. Please try again.', { timeout: 20_000 })
})
