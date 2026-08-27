import { test, expect } from '@playwright-backend-mocks/playwright'
import { mockAnthropic } from './anthropic'
import { signInWithAdminSession } from './auth'
import { expectAlert, feedbackResult, field, fillMidtimeValuation, openApp, openTab, pane, submitValuation, valuationResult } from './helpers'

test.beforeEach(async ({ page, backendMocks }) => {
  await mockAnthropic(backendMocks)
  await openApp(page)
})

test('submit shows thank-you and backs up to localStorage', async ({ page }) => {
  await openTab(page, 'feedback')
  const form = pane(page, 'feedback')
  await field(form, 'Aircraft').fill('1981 Beech B58 Baron')
  await field(form, 'Your feedback').fill('Great tool, very accurate.')

  const responseP = page.waitForResponse((r) => r.url().includes('/api/feedback') && r.request().method() === 'POST')
  await form.getByRole('button', { name: 'Send feedback' }).click()
  const response = await responseP
  expect(response.ok()).toBeTruthy()

  await expect(feedbackResult(page)).toContainText('Thank you for your feedback')

  const stored = await page.evaluate(() => localStorage.getItem('spv_feedback'))
  expect(stored).toBeTruthy()
  const arr = JSON.parse(stored as string)
  expect(arr[arr.length - 1]).toMatchObject({ message: 'Great tool, very accurate.' })
})

test('accuracy-only submit is accepted', async ({ page }) => {
  await openTab(page, 'feedback')
  const form = pane(page, 'feedback')
  await field(form, 'Valuation accuracy').selectOption('right')
  const responseP = page.waitForResponse((r) => r.url().includes('/api/feedback') && r.request().method() === 'POST')
  await form.getByRole('button', { name: 'Send feedback' }).click()
  expect((await responseP).ok()).toBeTruthy()
  await expect(feedbackResult(page)).toContainText('Thank you for your feedback')

  const stored = await page.evaluate(() => localStorage.getItem('spv_feedback'))
  const arr = JSON.parse(stored as string)
  expect(arr[arr.length - 1]).toMatchObject({ accuracy: 'right' })
})

test('empty submit alerts the user', async ({ page }) => {
  await openTab(page, 'feedback')
  await expectAlert(
    page,
    () => pane(page, 'feedback').getByRole('button', { name: 'Send feedback' }).click({ force: true }),
    'Please enter feedback or select accuracy.',
  )
})

test('post-valuation accuracy buttons write feedback', async ({ page }) => {
  await signInWithAdminSession(page)
  await fillMidtimeValuation(page)
  await submitValuation(page)
  const responseP = page.waitForResponse((r) => r.url().includes('/api/feedback') && r.request().method() === 'POST')
  await valuationResult(page).getByRole('button', { name: 'About right' }).click()
  expect((await responseP).ok()).toBeTruthy()
  await expect(valuationResult(page)).toContainText('your rating helps us improve')
  await expect(valuationResult(page).getByRole('button', { name: 'About right' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  const stored = await page.evaluate(() => localStorage.getItem('spv_feedback'))
  const arr = JSON.parse(stored as string)
  expect(arr[arr.length - 1]).toMatchObject({ accuracy: 'right' })
  expect(arr[arr.length - 1].message).toContain('Post-valuation rating')
})
