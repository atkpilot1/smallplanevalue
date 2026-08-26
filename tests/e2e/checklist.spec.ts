import { test, expect } from '@playwright-backend-mocks/playwright'
import type { Page } from '@playwright/test'
import { failAnthropic, mockAnthropic } from './anthropic'
import { checklistResult, expectAlert, field, lookupN, lookupResult, openApp, openTab, pane } from './helpers'

test.beforeEach(async ({ page, backendMocks }) => {
  await mockAnthropic(backendMocks)
  await openApp(page)
})

async function generateChecklist(page: Page, make: string, model: string, year = '2004') {
  await openTab(page, 'checklist')
  const form = pane(page, 'checklist')
  await field(form, 'Make').fill(make)
  await field(form, 'Model').fill(model)
  await field(form, 'Year').fill(year)
  await form.getByRole('button', { name: 'Generate inspection checklist' }).click()
  await expect(checklistResult(page)).toContainText('Documents and Records', { timeout: 20_000 })
}

test('generates static sections plus mocked model-specific items', async ({ page }) => {
  await generateChecklist(page, 'Cessna', '172S')
  const result = checklistResult(page)
  await expect(result).toContainText('172S Specific Items')
  await expect(result).toContainText('Seat rail AD 2011-10-09')
  await expect(result).toContainText('Firewall SB05-1 inspection')
})

test('static sections always appear', async ({ page }) => {
  await generateChecklist(page, 'Cessna', '172S')
  const result = checklistResult(page)
  await expect(result).toContainText('Documents and Records')
  await expect(result).toContainText('Engine Logbook and History')
  await expect(result).toContainText('Flight Check')
  await expect(result).toContainText('Airworthiness certificate')
})

test('retract extras appear for model 210', async ({ page }) => {
  await generateChecklist(page, 'Cessna', '210', '1978')
  await expect(checklistResult(page)).toContainText('Gear retraction test')
  await expect(checklistResult(page)).toContainText('Emergency gear extension')
})

test('twin extras appear for model Baron', async ({ page }) => {
  await generateChecklist(page, 'Beech', 'Baron', '1981')
  await expect(checklistResult(page)).toContainText('Single engine performance')
  await expect(checklistResult(page)).toContainText('Engine synchronization')
})

test('lookup of 182RG then checklist includes retract-gear items', async ({ page }) => {
  await lookupN(page, '182RG')
  await expect(lookupResult(page)).toContainText('R182')
  await lookupResult(page).getByRole('button', { name: 'Pre-buy checklist' }).click()
  await pane(page, 'checklist').getByRole('button', { name: 'Generate inspection checklist' }).click()
  await expect(checklistResult(page)).toContainText('Documents and Records', { timeout: 20_000 })
  await expect(checklistResult(page)).toContainText('Gear retraction test')
})

test('lookup of 58P then checklist includes twin-engine items', async ({ page }) => {
  await lookupN(page, '58P')
  await expect(lookupResult(page)).toContainText('58P')
  await lookupResult(page).getByRole('button', { name: 'Pre-buy checklist' }).click()
  await pane(page, 'checklist').getByRole('button', { name: 'Generate inspection checklist' }).click()
  await expect(checklistResult(page)).toContainText('Documents and Records', { timeout: 20_000 })
  await expect(checklistResult(page)).toContainText('Single engine performance')
})

test('pass, flag, and fail update progress, stats, and verdict', async ({ page }) => {
  await generateChecklist(page, 'Cessna', '172S')
  const result = checklistResult(page)
  await result.getByRole('button', { name: 'Pass' }).first().click()
  await result.getByRole('button', { name: 'Flag' }).nth(1).click()
  await result.getByRole('button', { name: 'Fail' }).nth(2).click()

  await expect(result).toContainText('1')
  await expect(result).toContainText('Passed')
  await expect(result).toContainText('Flagged')
  await expect(result).toContainText('Failed')
  await expect(result).toContainText('Issues found')
  await expect(result).toContainText('ITEMS NEEDING ATTENTION')
  await expect(page.getByRole('progressbar', { name: 'Checklist progress' })).toHaveAttribute(
    'aria-valuenow',
    /[1-9]/,
  )
})

test('Anthropic 500 still renders the static checklist', async ({ page }) => {
  failAnthropic('checklist')
  await openTab(page, 'checklist')
  const form = pane(page, 'checklist')
  await field(form, 'Make').fill('Cessna')
  await field(form, 'Model').fill('172S')
  await field(form, 'Year').fill('2004')
  await form.getByRole('button', { name: 'Generate inspection checklist' }).click()
  await expect(checklistResult(page)).toContainText('Documents and Records', { timeout: 20_000 })
  await expect(checklistResult(page)).not.toContainText('Specific Items')
})

test('empty make and model alerts the user', async ({ page }) => {
  await openTab(page, 'checklist')
  await expectAlert(
    page,
    () => pane(page, 'checklist').getByRole('button', { name: 'Generate inspection checklist' }).click({ force: true }),
    'Enter make and model.',
  )
})
