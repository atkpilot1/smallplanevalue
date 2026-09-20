import { test, expect } from './fixtures'
import { expectAlert, field, lookupN, lookupResult, openApp, openTab, pane, tab } from './helpers'

test.beforeEach(async ({ page }) => {
  await openApp(page)
})

test('seeded 172SP renders the FAA record from local Supabase', async ({ page }) => {
  await lookupN(page, '172SP')
  const result = lookupResult(page)
  await expect(result).toContainText('CESSNA')
  await expect(result).toContainText('172S')
  await expect(result).toContainText('LOCAL DEV')
  await expect(result).toContainText('LYCOMING')
  await expect(result).toContainText('Registration current')
})

test('example N-number chip 172SP triggers a lookup', async ({ page }) => {
  await page.getByRole('button', { name: '172SP' }).click()
  await expect(lookupResult(page)).toContainText('CESSNA')
  await expect(lookupResult(page)).toContainText('172S')
})

test('seeded 22T renders Cirrus SR22T', async ({ page }) => {
  await lookupN(page, '22T')
  const result = lookupResult(page)
  await expect(result).toContainText('CIRRUS')
  await expect(result).toContainText('SR22T')
  await expect(result).toContainText('CONTINENTAL')
})

test('seeded 182RG renders Cessna R182', async ({ page }) => {
  await lookupN(page, '182RG')
  const result = lookupResult(page)
  await expect(result).toContainText('CESSNA')
  await expect(result).toContainText('R182')
})

test('seeded 58P renders Beech 58P', async ({ page }) => {
  await lookupN(page, '58P')
  const result = lookupResult(page)
  await expect(result).toContainText('BEECH')
  await expect(result).toContainText('58P')
  await expect(result).toContainText('multi', { ignoreCase: true })
})

test('unknown N-number shows the not-found state', async ({ page }) => {
  await lookupN(page, 'ZZZZZ')
  const result = lookupResult(page)
  await expect(result).toContainText('No aircraft found')
  await expect(result).toContainText('NZZZZZ')
  await expect(result.getByRole('link', { name: /search FAA directly/i })).toBeVisible()
})

test('empty N-number alerts the user', async ({ page }) => {
  await expectAlert(
    page,
    () => pane(page, 'lookup').getByRole('button', { name: 'Look up' }).click({ force: true }),
    'Enter an N-number.',
  )
})

test('deep link ?n=172SP auto-looks up the aircraft', async ({ page }) => {
  await openApp(page, '/?n=172SP')
  await expect(tab(page, 'lookup')).toHaveAttribute('aria-selected', 'true')
  await expect(field(pane(page, 'lookup'), 'N-number')).toHaveValue('172SP')
  await expect(lookupResult(page)).toContainText('CESSNA', { timeout: 15_000 })
  await expect(lookupResult(page)).toContainText('172S')
})

test('lookup Get valuation prefills make, model, year, and engine', async ({ page }) => {
  await lookupN(page, '172SP')
  await expect(lookupResult(page)).toContainText('CESSNA')
  await lookupResult(page).getByRole('button', { name: 'Get valuation' }).click()
  await expect(tab(page, 'val')).toHaveAttribute('aria-selected', 'true')
  const val = pane(page, 'val')
  await expect(field(val, 'Make')).toHaveValue('CESSNA')
  await expect(field(val, 'Model')).toHaveValue('172S')
  await expect(field(val, 'Year')).toHaveValue('2005')
  await expect(field(val, 'Engine')).toHaveValue(/LYCOMING\s+IO-360-L2A/)
})

test('lookup Pre-buy checklist prefills make, model, and year', async ({ page }) => {
  await lookupN(page, '172SP')
  await expect(lookupResult(page)).toContainText('CESSNA')
  await lookupResult(page).getByRole('button', { name: 'Pre-buy checklist' }).click()
  await expect(tab(page, 'checklist')).toHaveAttribute('aria-selected', 'true')
  const cl = pane(page, 'checklist')
  await expect(field(cl, 'Make')).toHaveValue('CESSNA')
  await expect(field(cl, 'Model')).toHaveValue('172S')
  await expect(field(cl, 'Year')).toHaveValue('2005')
})

test('lookup of twin 58P switches the valuation form to twin fields', async ({ page }) => {
  await lookupN(page, '58P')
  await expect(lookupResult(page)).toContainText('BEECH')
  await openTab(page, 'val')
  const val = pane(page, 'val')
  await expect(field(val, 'Engines')).toHaveValue('2')
  await expect(field(val, 'Left engine SMOH (hrs)')).toBeVisible()
  await expect(field(val, 'Right engine SMOH (hrs)')).toBeVisible()
})

test('unseeded example chip RV10 shows not-found', async ({ page }) => {
  await page.getByRole('button', { name: 'RV10' }).click()
  await expect(lookupResult(page)).toContainText('No aircraft found')
})
