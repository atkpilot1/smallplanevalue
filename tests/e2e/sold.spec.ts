import { test, expect } from '@playwright-backend-mocks/playwright'
import { mockAnthropic } from './anthropic'
import { openApp, openTab } from './helpers'

test.beforeEach(async ({ page, backendMocks }) => {
  await mockAnthropic(backendMocks)
  await openApp(page)
})

test('missing required fields shows the validation note', async ({ page }) => {
  await openTab(page, 'sold')
  await page.locator('#sd-btn').click()
  await expect(page.locator('#sd-result')).toContainText('at least make, model, year')
})

test('parse sale post auto-fills the form', async ({ page }) => {
  await openTab(page, 'sold')
  await page.locator('#sd-paste').fill('SOLD 1998 Beechcraft A36 for $285k, was asking $310k, 4200 TT, 650 SMOH')
  await page.locator('#sd-paste-btn').click()
  await expect(page.locator('#sd-make')).toHaveValue('Beechcraft')
  await expect(page.locator('#sd-model')).toHaveValue('A36')
  await expect(page.locator('#sd-year')).toHaveValue('1998')
  await expect(page.locator('#sd-price')).toHaveValue('285000')
  await expect(page.locator('#sd-ask')).toHaveValue('310000')
  await expect(page.locator('#sd-result')).toContainText('Fields filled from post')
})

test('submit stores localStorage and renders recent sales', async ({ page }) => {
  await openTab(page, 'sold')
  await page.locator('#sd-make').fill('Cessna')
  await page.locator('#sd-model').fill('172S')
  await page.locator('#sd-year').fill('2004')
  await page.locator('#sd-price').fill('135000')
  await page.locator('#sd-ask').fill('159000')
  await page.locator('#sd-agree').check()
  await page.locator('#sd-btn').click()

  await expect(page.locator('#sd-result')).toContainText('Sale data submitted')
  await expect(page.locator('#sd-recent')).toContainText('2004 Cessna 172S')

  const stored = await page.evaluate(() => localStorage.getItem('spv_sold'))
  expect(stored).toBeTruthy()
  const arr = JSON.parse(stored as string)
  expect(arr[0]).toMatchObject({ make: 'Cessna', model: '172S', year: 2004, price: 135000 })
})

test('submit without the confirmation checkbox is blocked', async ({ page }) => {
  await openTab(page, 'sold')
  await page.locator('#sd-make').fill('Cessna')
  await page.locator('#sd-model').fill('172S')
  await page.locator('#sd-year').fill('2004')
  await page.locator('#sd-price').fill('135000')
  await page.locator('#sd-btn').click()
  await expect(page.locator('#sd-result')).toContainText('Please check the confirmation box')
})

test('thank-you card shows discount vs asking price', async ({ page }) => {
  await openTab(page, 'sold')
  await page.locator('#sd-make').fill('Cessna')
  await page.locator('#sd-model').fill('172S')
  await page.locator('#sd-year').fill('2004')
  await page.locator('#sd-price').fill('135000')
  await page.locator('#sd-ask').fill('159000')
  await page.locator('#sd-agree').check()
  await page.locator('#sd-btn').click()
  await expect(page.locator('#sd-result')).toContainText('Sale data submitted')
  await expect(page.locator('#sd-result')).toContainText('-15%')
  await expect(page.locator('#sd-result')).toContainText('vs. asking')
})

test('recent list caps at 10 and reports the overflow', async ({ page }) => {
  const extras = Array.from({ length: 11 }, (_, i) => ({
    id: i + 1,
    make: 'Cessna',
    model: '172S',
    year: 2000 + i,
    price: 100000 + i,
    ts: new Date().toISOString(),
  }))
  await page.evaluate((rows) => localStorage.setItem('spv_sold', JSON.stringify(rows)), extras)
  await openTab(page, 'sold')
  await expect(page.locator('#sd-recent')).toContainText('Showing 10 of 11 submissions')
  await expect(page.locator('#sd-recent')).toContainText('2000 Cessna 172S')
  await expect(page.locator('#sd-recent')).not.toContainText('2010 Cessna 172S')
})
