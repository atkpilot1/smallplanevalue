import { test, expect } from '@playwright-backend-mocks/playwright'
import { mockAnthropic } from './anthropic'
import { expectAlert, fillMidtimeValuation, openApp, openTab, submitValuation } from './helpers'

test.beforeEach(async ({ page, backendMocks }) => {
  await mockAnthropic(backendMocks)
  await openApp(page)
})

test('submit shows thank-you and backs up to localStorage', async ({ page }) => {
  await openTab(page, 'feedback')
  await page.locator('#fb-aircraft').fill('1981 Beech B58 Baron')
  await page.locator('#fb-message').fill('Great tool, very accurate.')

  const responseP = page.waitForResponse((r) => r.url().includes('/api/feedback') && r.request().method() === 'POST')
  await page.locator('#fb-btn').click()
  const response = await responseP
  expect(response.ok()).toBeTruthy()

  await expect(page.locator('#fb-result')).toContainText('Thank you for your feedback')

  const stored = await page.evaluate(() => localStorage.getItem('spv_feedback'))
  expect(stored).toBeTruthy()
  const arr = JSON.parse(stored as string)
  expect(arr[arr.length - 1]).toMatchObject({ message: 'Great tool, very accurate.' })
})

test('accuracy-only submit is accepted', async ({ page }) => {
  await openTab(page, 'feedback')
  await page.locator('#fb-accuracy').selectOption('right')
  const responseP = page.waitForResponse((r) => r.url().includes('/api/feedback') && r.request().method() === 'POST')
  await page.locator('#fb-btn').click()
  expect((await responseP).ok()).toBeTruthy()
  await expect(page.locator('#fb-result')).toContainText('Thank you for your feedback')

  const stored = await page.evaluate(() => localStorage.getItem('spv_feedback'))
  const arr = JSON.parse(stored as string)
  expect(arr[arr.length - 1]).toMatchObject({ accuracy: 'right' })
})

test('empty submit alerts the user', async ({ page }) => {
  await openTab(page, 'feedback')
  await expectAlert(
    page,
    () => page.locator('#fb-btn').click({ force: true }),
    'Please enter feedback or select accuracy.',
  )
})

test('post-valuation accuracy buttons write feedback', async ({ page }) => {
  await fillMidtimeValuation(page)
  await submitValuation(page)
  const responseP = page.waitForResponse((r) => r.url().includes('/api/feedback') && r.request().method() === 'POST')
  await page.locator('#v-result').getByRole('button', { name: 'About right' }).click()
  expect((await responseP).ok()).toBeTruthy()
  await expect(page.locator('#val-accuracy-msg')).toContainText('your rating helps us improve')
  await expect(page.locator('#v-result').getByRole('button', { name: 'About right' })).toHaveClass(/selected/)

  const stored = await page.evaluate(() => localStorage.getItem('spv_feedback'))
  const arr = JSON.parse(stored as string)
  expect(arr[arr.length - 1]).toMatchObject({ accuracy: 'right' })
  expect(arr[arr.length - 1].message).toContain('Post-valuation rating')
})
