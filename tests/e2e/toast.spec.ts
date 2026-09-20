import { test, expect } from './fixtures'
import { appToast, openApp } from './helpers'

test('paid=1 shows a success toast that the X dismisses', async ({ page }) => {
  await openApp(page, '/?paid=1')
  await expect(appToast(page)).toContainText(/credits added/i)
  await page.getByRole('button', { name: 'Dismiss' }).click()
  await expect(appToast(page)).toHaveCount(0)
})

test('paid=0 shows a canceled toast', async ({ page }) => {
  await openApp(page, '/?paid=0')
  await expect(appToast(page)).toContainText(/checkout canceled/i)
})

test('toast dismisses itself after 10 seconds', async ({ page }) => {
  await page.clock.install()
  await openApp(page, '/?paid=1')
  await expect(appToast(page)).toContainText(/credits added/i)
  await page.clock.fastForward(9_500)
  await expect(appToast(page)).toBeVisible()
  await page.clock.fastForward(1000)
  await expect(appToast(page)).toHaveCount(0)
})
