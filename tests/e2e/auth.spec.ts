import { test, expect } from './fixtures'
import { mockAnthropic } from './anthropic'
import {
  accountDialog,
  fetchOtp,
  loginDialog,
  manageAccountButton,
  openLogin,
  requestOtp,
  signInButton,
  signInWithOtp,
  uniqueTestEmail,
} from './auth'
import { openApp } from './helpers'

test.beforeEach(async ({ page, backendMocks }) => {
  await mockAnthropic(backendMocks)
  await openApp(page)
})

test('nav shows Sign In and not Manage Account', async ({ page }) => {
  await expect(signInButton(page)).toBeVisible()
  await expect(manageAccountButton(page)).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Look up my plane' })).toBeVisible()
})

test('Sign In opens a dialog that Close and Escape dismiss', async ({ page }) => {
  await openLogin(page)
  await loginDialog(page).getByRole('button', { name: 'Close' }).click()
  await expect(loginDialog(page)).toBeHidden()
  await expect(signInButton(page)).toBeVisible()

  await openLogin(page)
  await page.keyboard.press('Escape')
  await expect(loginDialog(page)).toBeHidden()
})

test('empty and invalid email stay on the email step with an error', async ({ page }) => {
  await openLogin(page)
  const dialog = loginDialog(page)
  await dialog.getByRole('button', { name: /send code/i }).click()
  await expect(dialog.getByRole('alert')).toContainText(/valid email/i)
  await expect(dialog.getByLabel(/^email$/i)).toBeVisible()

  await dialog.getByLabel(/^email$/i).fill('not-an-email')
  await dialog.getByRole('button', { name: /send code/i }).click()
  await expect(dialog.getByRole('alert')).toContainText(/valid email/i)
  await expect(dialog.getByLabel(/verification code/i)).toHaveCount(0)
  await expect(signInButton(page)).toBeVisible()
})

test('OTP sign-in, account popup, sign out, and session persist across reload', async ({ page }) => {
  const email = await signInWithOtp(page)
  await expect(signInButton(page)).toHaveCount(0)

  await manageAccountButton(page).click()
  const account = accountDialog(page)
  await expect(account).toBeVisible()
  await expect(account).toContainText(email)
  await expect(account.getByLabel('Valuations run')).toHaveText('0')
  await expect(account.getByLabel('Free remaining')).toHaveText('3')
  await expect(account.getByLabel('Paid credits')).toHaveText('0')
  await expect(account.getByRole('button', { name: '1 valuation — $24' })).toBeVisible()
  await expect(account.getByRole('button', { name: '5 valuations — $75' })).toBeVisible()

  await account.getByRole('button', { name: 'Close' }).click()
  await expect(account).toBeHidden()
  await expect(manageAccountButton(page)).toBeVisible()

  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(manageAccountButton(page)).toBeVisible({ timeout: 15_000 })
  await expect(signInButton(page)).toHaveCount(0)

  await manageAccountButton(page).click()
  await accountDialog(page).getByRole('button', { name: 'Sign out' }).click()
  await expect(accountDialog(page)).toBeHidden()
  await expect(signInButton(page)).toBeVisible()
  await expect(manageAccountButton(page)).toHaveCount(0)
})

test('bad OTP stays logged out and shows an error', async ({ page, consoleGuard }) => {
  consoleGuard.allow(403)
  const email = uniqueTestEmail()
  await openLogin(page)
  await requestOtp(page, email)
  await fetchOtp(email)

  const dialog = loginDialog(page)
  await dialog.getByLabel(/verification code/i).fill('000000')
  await dialog.getByRole('button', { name: /^verify$/i }).click()
  await expect(dialog.getByRole('alert')).toBeVisible({ timeout: 15_000 })
  await expect(dialog).toBeVisible()
  await expect(signInButton(page)).toBeVisible()
  await expect(manageAccountButton(page)).toHaveCount(0)
})

test('Use a different email returns to the email step', async ({ page }) => {
  const email = uniqueTestEmail()
  await openLogin(page)
  await requestOtp(page, email)
  const dialog = loginDialog(page)
  await dialog.getByRole('button', { name: /use a different email/i }).click()
  await expect(dialog.getByLabel(/^email$/i)).toBeVisible()
  await expect(dialog.getByLabel(/verification code/i)).toHaveCount(0)
})

test('a second account replaces the previous session', async ({ page }) => {
  const first = await signInWithOtp(page)
  await manageAccountButton(page).click()
  await accountDialog(page).getByRole('button', { name: 'Sign out' }).click()
  await expect(signInButton(page)).toBeVisible()

  const second = uniqueTestEmail()
  expect(second).not.toBe(first)
  await signInWithOtp(page, second)
  await manageAccountButton(page).click()
  await expect(accountDialog(page)).toContainText(second)
  await expect(accountDialog(page)).not.toContainText(first)
})
