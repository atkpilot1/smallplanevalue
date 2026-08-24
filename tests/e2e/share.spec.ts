import { test, expect } from '@playwright-backend-mocks/playwright'
import { mockAnthropic } from './anthropic'
import { openApp, openTab } from './helpers'

test.beforeEach(async ({ page, backendMocks }) => {
  await mockAnthropic(backendMocks)
  await openApp(page)
})

test('copy-for-BeechTalk sets the copied confirmation', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await openTab(page, 'feedback')
  await page.locator('#share-copy').click()
  await expect(page.locator('#share-copy-msg')).toContainText('Copied')
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied).toContain(new URL(page.url()).origin)
  expect(copied).toContain('honest asking ranges')
})

test('Facebook and X links point at the current origin', async ({ page }) => {
  await openTab(page, 'feedback')
  const origin = new URL(page.url()).origin
  const encoded = encodeURIComponent(origin)
  await expect(page.locator('#share-fb')).toHaveAttribute('href', new RegExp(`facebook\\.com/sharer.*${encoded}`))
  await expect(page.locator('#share-x')).toHaveAttribute('href', /twitter\.com\/intent\/tweet/)
  await expect(page.locator('#share-x')).toHaveAttribute('href', new RegExp(encoded))
})
