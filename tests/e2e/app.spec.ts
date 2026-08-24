import { test, expect } from '@playwright-backend-mocks/playwright'
import { mockAnthropic } from './anthropic'
import { openApp } from './helpers'

test.beforeEach(async ({ page, backendMocks }) => {
  await mockAnthropic(backendMocks)
  await openApp(page)
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
