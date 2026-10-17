import { test, expect } from './fixtures'
import { field, openApp, pane } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('spv_valuation_form')
  })
})

test('aircraft guide explains a Baron and opens a prefilled valuation', async ({ page }) => {
  await openApp(page, '/aircraft/baron')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/both engines/i)
  await expect(page.getByRole('link', { name: 'Beech Bonanza' })).toBeVisible()

  await page.getByRole('link', { name: 'Value this Baron' }).click()
  await expect(pane(page, 'val')).toBeVisible()
  const val = pane(page, 'val')
  await expect(field(val, 'Make')).toHaveValue('Beechcraft')
  await expect(field(val, 'Model')).toHaveValue('Baron 58')
  await expect(field(val, 'Engines')).toHaveValue('2')
})

test('unknown aircraft guide is not found', async ({ page, consoleGuard }) => {
  consoleGuard.allow(/404/)
  const response = await page.goto('/aircraft/not-a-plane', { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBe(404)
})
