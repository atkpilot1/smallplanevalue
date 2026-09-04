import { test, expect } from './fixtures'
import { failAnthropic, mockAnthropic } from './anthropic'
import { compsResult, expectAlert, field, lookupN, lookupResult, openApp, openTab, pane } from './helpers'

test.beforeEach(async ({ page, backendMocks }) => {
  await mockAnthropic(backendMocks)
  await openApp(page)
})

test('search renders asking ranges and days listed', async ({ page }) => {
  await openTab(page, 'comps')
  const form = pane(page, 'comps')
  await field(form, 'Make & model').fill('Cessna 172S')
  await form.getByRole('button', { name: 'Search asking prices' }).click()
  const result = compsResult(page)
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
  await expect(lookupResult(page)).toContainText('CESSNA')
  await openTab(page, 'comps')
  await expect(field(pane(page, 'comps'), 'Make & model')).toHaveValue('CESSNA 172S')
})

test('empty model alerts the user', async ({ page }) => {
  await openTab(page, 'comps')
  await expectAlert(
    page,
    () => pane(page, 'comps').getByRole('button', { name: 'Search asking prices' }).click({ force: true }),
    'Enter a make and model.',
  )
})

test('year-band select still returns listing ranges', async ({ page }) => {
  await openTab(page, 'comps')
  const form = pane(page, 'comps')
  await field(form, 'Make & model').fill('Cessna 172S')
  await field(form, 'Year range').selectOption({ label: '2015 – present' })
  await form.getByRole('button', { name: 'Search asking prices' }).click()
  await expect(compsResult(page)).toContainText('$295,000', { timeout: 20_000 })
})

test('Anthropic 500 surfaces a comps failure', async ({ page, consoleGuard }) => {
  consoleGuard.allow(500)
  failAnthropic('comps')
  await openTab(page, 'comps')
  const form = pane(page, 'comps')
  await field(form, 'Make & model').fill('Cessna 172S')
  await form.getByRole('button', { name: 'Search asking prices' }).click()
  await expect(compsResult(page)).toContainText('Failed. Please try again.', { timeout: 20_000 })
})
