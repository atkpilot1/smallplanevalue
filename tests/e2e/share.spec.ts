import { test, expect } from '@playwright-backend-mocks/playwright'
import { mockAnthropic } from './anthropic'
import { openApp, openTab, pane } from './helpers'

test.beforeEach(async ({ page, backendMocks }) => {
  await mockAnthropic(backendMocks)
  await openApp(page)
})

test('copy-for-BeechTalk sets the copied confirmation', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await openTab(page, 'feedback')
  await page.getByRole('button', { name: /Copy for BeechTalk/ }).click()
  await expect(page.getByText(/Copied/)).toBeVisible()
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied).toContain(new URL(page.url()).origin)
  expect(copied).toContain('honest asking ranges')
})

test('Facebook and X links point at the current origin', async ({ page }) => {
  await openTab(page, 'feedback')
  const origin = new URL(page.url()).origin
  const encoded = encodeURIComponent(origin)
  const share = pane(page, 'feedback')
  await expect(share.getByRole('link', { name: 'Facebook', exact: true })).toHaveAttribute(
    'href',
    new RegExp(`facebook\\.com/sharer.*${encoded}`),
  )
  const x = share.getByRole('link', { name: 'X', exact: true })
  await expect(x).toHaveAttribute('href', /twitter\.com\/intent\/tweet/)
  await expect(x).toHaveAttribute('href', new RegExp(encoded))
  await expect(page.getByRole('link', { name: 'Share on Facebook' })).toHaveAttribute(
    'href',
    new RegExp(`facebook\\.com/sharer.*${encoded}`),
  )
  await expect(page.getByRole('link', { name: 'Share on X' })).toHaveAttribute(
    'href',
    new RegExp(encoded),
  )
})
