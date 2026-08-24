import { test, expect } from '@playwright-backend-mocks/playwright'
import type { Page } from '@playwright/test'
import { failAnthropic, mockAnthropic } from './anthropic'
import { expectAlert, lookupN, openApp, openTab } from './helpers'

test.beforeEach(async ({ page, backendMocks }) => {
  await mockAnthropic(backendMocks)
  await openApp(page)
})

async function generateChecklist(page: Page, make: string, model: string, year = '2004') {
  await openTab(page, 'checklist')
  await page.locator('#cl-make').fill(make)
  await page.locator('#cl-model').fill(model)
  await page.locator('#cl-year').fill(year)
  await page.locator('#cl-btn').click()
  await expect(page.locator('#cl-result')).toContainText('Documents and Records', { timeout: 20_000 })
}

test('generates static sections plus mocked model-specific items', async ({ page }) => {
  await generateChecklist(page, 'Cessna', '172S')
  const result = page.locator('#cl-result')
  await expect(result).toContainText('172S Specific Items')
  await expect(result).toContainText('Seat rail AD 2011-10-09')
  await expect(result).toContainText('Firewall SB05-1 inspection')
})

test('static sections always appear', async ({ page }) => {
  await generateChecklist(page, 'Cessna', '172S')
  const result = page.locator('#cl-result')
  await expect(result).toContainText('Documents and Records')
  await expect(result).toContainText('Engine Logbook and History')
  await expect(result).toContainText('Flight Check')
  await expect(result).toContainText('Airworthiness certificate')
})

test('retract extras appear for model 210', async ({ page }) => {
  await generateChecklist(page, 'Cessna', '210', '1978')
  await expect(page.locator('#cl-result')).toContainText('Gear retraction test')
  await expect(page.locator('#cl-result')).toContainText('Emergency gear extension')
})

test('twin extras appear for model Baron', async ({ page }) => {
  await generateChecklist(page, 'Beech', 'Baron', '1981')
  await expect(page.locator('#cl-result')).toContainText('Single engine performance')
  await expect(page.locator('#cl-result')).toContainText('Engine synchronization')
})

test('lookup of 182RG then checklist includes retract-gear items', async ({ page }) => {
  await lookupN(page, '182RG')
  await expect(page.locator('#nn-result')).toContainText('R182')
  await page.locator('#nn-result').getByRole('button', { name: 'Pre-buy checklist' }).click()
  await page.locator('#cl-btn').click()
  await expect(page.locator('#cl-result')).toContainText('Documents and Records', { timeout: 20_000 })
  await expect(page.locator('#cl-result')).toContainText('Gear retraction test')
})

test('lookup of 58P then checklist includes twin-engine items', async ({ page }) => {
  await lookupN(page, '58P')
  await expect(page.locator('#nn-result')).toContainText('58P')
  await page.locator('#nn-result').getByRole('button', { name: 'Pre-buy checklist' }).click()
  await page.locator('#cl-btn').click()
  await expect(page.locator('#cl-result')).toContainText('Documents and Records', { timeout: 20_000 })
  await expect(page.locator('#cl-result')).toContainText('Single engine performance')
})

test('pass, flag, and fail update progress, stats, and verdict', async ({ page }) => {
  await generateChecklist(page, 'Cessna', '172S')
  const first = page.locator('#cli-0')
  await first.getByTitle('Pass').click()
  await page.locator('#cli-1').getByTitle('Flag').click()
  await page.locator('#cli-2').getByTitle('Fail').click()

  await expect(page.locator('#cl-stats-row')).toContainText('1')
  await expect(page.locator('#cl-summary')).toContainText('Passed')
  await expect(page.locator('#cl-summary')).toContainText('Flagged')
  await expect(page.locator('#cl-summary')).toContainText('Failed')
  await expect(page.locator('#cl-summary')).toContainText('Issues found')
  await expect(page.locator('#cl-summary')).toContainText('ITEMS NEEDING ATTENTION')
  await expect(page.locator('#cl-prog')).toHaveAttribute('style', /width:\s*[1-9]/)
})

test('Anthropic 500 still renders the static checklist', async ({ page }) => {
  failAnthropic('checklist')
  await openTab(page, 'checklist')
  await page.locator('#cl-make').fill('Cessna')
  await page.locator('#cl-model').fill('172S')
  await page.locator('#cl-year').fill('2004')
  await page.locator('#cl-btn').click()
  await expect(page.locator('#cl-result')).toContainText('Documents and Records', { timeout: 20_000 })
  await expect(page.locator('#cl-result')).not.toContainText('Specific Items')
})

test('empty make and model alerts the user', async ({ page }) => {
  await openTab(page, 'checklist')
  await expectAlert(page, () => page.locator('#cl-btn').click({ force: true }), 'Enter make and model.')
})
