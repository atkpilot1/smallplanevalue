import { test, expect } from '@playwright-backend-mocks/playwright'
import { mockAnthropic } from './anthropic'
import { openApp, tab, TABS } from './helpers'

test.beforeEach(async ({ page, backendMocks }) => {
  await mockAnthropic(backendMocks)
  await openApp(page)
})

test('page renders with the expected title and hero', async ({ page }) => {
  await expect(page).toHaveTitle(/SmallPlaneValue/)
  await expect(page.getByRole('heading', { name: /Know What Your/ })).toBeVisible()
  await expect(tab(page, 'lookup')).toBeVisible()
})

test('tab switching activates each pane', async ({ page }) => {
  for (const id of Object.keys(TABS) as Array<keyof typeof TABS>) {
    await tab(page, id).click()
    await expect(tab(page, id)).toHaveAttribute('aria-selected', 'true')
  }
})
