import { test, expect } from '@playwright-backend-mocks/playwright'
import { mockAnthropic } from './anthropic'

/**
 * Drive the real Nuxt handlers. Anthropic is mocked at the Node boundary;
 * local Supabase (FAA lookup, feedback, usage_events) is live.
 */

test.beforeEach(async ({ page, backendMocks }) => {
  await mockAnthropic(backendMocks)
  await page.goto('/', { waitUntil: 'domcontentloaded' })
})

test('page renders with the expected title and hero', async ({ page }) => {
  await expect(page).toHaveTitle(/SmallPlaneValue/)
  await expect(page.locator('.hero-h1')).toContainText('Know What Your')
  await expect(page.locator('#tab-btn-lookup')).toBeVisible()
})

test('tab switching activates each pane', async ({ page }) => {
  const tabs = ['val', 'comps', 'checklist', 'sold', 'feedback', 'lookup']
  for (const id of tabs) {
    await page.locator(`#tab-btn-${id}`).click()
    await expect(page.locator(`#pane-${id}`)).toHaveClass(/active/)
  }
})

test('N-number lookup renders the FAA record', async ({ page }) => {
  await page.locator('#nn').fill('172SP')
  await page.locator('#nn-btn').click()
  const result = page.locator('#nn-result')
  await expect(result).toContainText('CESSNA')
  await expect(result).toContainText('172S')
  await expect(result).toContainText('LOCAL DEV')
  await expect(result).toContainText('LYCOMING')
})

test('example N-number buttons trigger a lookup', async ({ page }) => {
  await page.getByRole('button', { name: '172SP' }).click()
  await expect(page.locator('#nn-result')).toContainText('CESSNA')
  await expect(page.locator('#nn-result')).toContainText('172S')
})

test('parse listing auto-fills the valuation form', async ({ page }) => {
  await page.locator('#tab-btn-val').click()
  await page.locator('#v-paste').fill('2004 Cessna 172S, 3200 TTAF, G1000, no damage history')
  await page.locator('#paste-btn').click()
  await expect(page.locator('#v-make')).toHaveValue('Cessna')
  await expect(page.locator('#v-model')).toHaveValue('172S')
  await expect(page.locator('#v-year')).toHaveValue('2004')
})

test('valuation renders the appraisal result', async ({ page }) => {
  await page.locator('#tab-btn-val').click()
  await page.locator('#v-make').fill('Cessna')
  await page.locator('#v-model').fill('172S')
  await page.locator('#v-year').fill('2004')
  await page.locator('#v-btn').click()
  const result = page.locator('#v-result')
  // Missing SMOH is coerced to 0 (fresh). engineAdjustment adds +$23k to the AI baseline.
  await expect(result).toContainText('$318,000')
  await expect(result).toContainText('$343,000')
  await expect(result).toContainText('$303,000')
  await expect(result).toContainText('Engine time premium')
})

test('market comps renders listing ranges', async ({ page }) => {
  await page.locator('#tab-btn-comps').click()
  await page.locator('#c-model').fill('Cessna 172S')
  await page.locator('#c-btn').click()
  const result = page.locator('#c-result')
  await expect(result).toContainText('$295,000')
  await expect(result).toContainText('45d')
})

test('checklist generates items including model-specific entries', async ({ page }) => {
  await page.locator('#tab-btn-checklist').click()
  await page.locator('#cl-make').fill('Cessna')
  await page.locator('#cl-model').fill('172S')
  await page.locator('#cl-year').fill('2004')
  await page.locator('#cl-btn').click()
  const result = page.locator('#cl-result')
  await expect(result).toContainText('172S Specific Items')
  await expect(result).toContainText('Seat rail AD 2011-10-09')
})

test('report a sale validates required fields', async ({ page }) => {
  await page.locator('#tab-btn-sold').click()
  await page.locator('#sd-btn').click()
  await expect(page.locator('#sd-result')).toContainText('at least make, model, year')
})

test('report a sale auto-fills from pasted post', async ({ page }) => {
  await page.locator('#tab-btn-sold').click()
  await page.locator('#sd-paste').fill('SOLD 1998 Beechcraft A36 for $285k, was asking $310k, 4200 TT, 650 SMOH')
  await page.locator('#sd-paste-btn').click()
  await expect(page.locator('#sd-make')).toHaveValue('Beechcraft')
  await expect(page.locator('#sd-model')).toHaveValue('A36')
  await expect(page.locator('#sd-year')).toHaveValue('1998')
  await expect(page.locator('#sd-price')).toHaveValue('285000')
  await expect(page.locator('#sd-ask')).toHaveValue('310000')
  await expect(page.locator('#sd-result')).toContainText('Fields filled from post')
})

test('report a sale stores submission in localStorage and renders recent sales', async ({ page }) => {
  await page.locator('#tab-btn-sold').click()
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

test('feedback submit shows thank-you and backs up to localStorage', async ({ page }) => {
  await page.locator('#tab-btn-feedback').click()
  await page.locator('#fb-aircraft').fill('1981 Beech B58 Baron')
  await page.locator('#fb-message').fill('Great tool, very accurate.')
  await page.locator('#fb-btn').click()

  await expect(page.locator('#fb-result')).toContainText('Thank you for your feedback')

  const stored = await page.evaluate(() => localStorage.getItem('spv_feedback'))
  expect(stored).toBeTruthy()
  const arr = JSON.parse(stored as string)
  expect(arr[arr.length - 1]).toMatchObject({ message: 'Great tool, very accurate.' })
})
