import { expect, type Page } from '@playwright-backend-mocks/playwright'

const MAILPIT = process.env.MAILPIT_URL || 'http://127.0.0.1:54324'

type MailpitList = {
  messages: Array<{
    ID: string
    To: Array<{ Address: string }>
    Created: string
  }>
}

type MailpitMessage = {
  Text?: string
  HTML?: string
}

export function uniqueTestEmail() {
  return `e2e+${crypto.randomUUID()}@example.com`
}

export function loginDialog(page: Page) {
  return page.getByRole('dialog', { name: /sign in/i })
}

export function accountDialog(page: Page) {
  return page.getByRole('dialog', { name: /manage account/i })
}

export function signInButton(page: Page) {
  return page.getByRole('button', { name: 'Sign In' })
}

export function manageAccountButton(page: Page) {
  return page.getByRole('button', { name: 'Manage Account' })
}

function extractOtp(text: string) {
  const labeled = text.match(/(?:code|otp)[^\d]{0,80}(\d{6})/i)
  if (labeled) return labeled[1]
  const isolated = text.match(/(?<!\d)(\d{6})(?!\d)/)
  return isolated?.[1] || null
}

export async function fetchOtp(email: string, timeoutMs = 15_000) {
  const want = email.toLowerCase()
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const listRes = await fetch(`${MAILPIT}/api/v1/messages`)
    if (!listRes.ok) throw new Error(`Mailpit list failed: ${listRes.status} ${await listRes.text()}`)
    const list = (await listRes.json()) as MailpitList
    const matches = (list.messages || []).filter((m) =>
      m.To?.some((to) => to.Address.toLowerCase() === want),
    )
    for (const msg of matches) {
      const fullRes = await fetch(`${MAILPIT}/api/v1/message/${msg.ID}`)
      if (!fullRes.ok) continue
      const full = (await fullRes.json()) as MailpitMessage
      const code = extractOtp(`${full.Text || ''}\n${full.HTML || ''}`)
      if (code) return code
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error(`OTP email not found for ${email}`)
}

export async function openLogin(page: Page) {
  await signInButton(page).click()
  await expect(loginDialog(page)).toBeVisible()
}

export async function requestOtp(page: Page, email: string) {
  const dialog = loginDialog(page)
  await dialog.getByLabel(/^email$/i).fill(email)
  await dialog.getByRole('button', { name: /send code/i }).click()
  await expect(dialog.getByLabel(/verification code/i)).toBeVisible({ timeout: 15_000 })
}

export async function signInWithOtp(page: Page, email = uniqueTestEmail()) {
  await openLogin(page)
  await requestOtp(page, email)
  const code = await fetchOtp(email)
  const dialog = loginDialog(page)
  await dialog.getByLabel(/verification code/i).fill(code)
  await dialog.getByRole('button', { name: /^verify$/i }).click()
  await expect(manageAccountButton(page)).toBeVisible({ timeout: 15_000 })
  await expect(dialog).toBeHidden()
  return email
}
