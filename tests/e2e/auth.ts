import { expect, type Page } from '@playwright-backend-mocks/playwright'
import { AUTH_STORAGE_KEY } from '../../utils/authStorage'

const MAILPIT = process.env.MAILPIT_URL || 'http://127.0.0.1:54324'

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
const SUPABASE_ANON =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

type AuthSession = {
  access_token: string
  refresh_token: string
  expires_in?: number
  expires_at?: number
  token_type?: string
  user?: unknown
}

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

/** Create a confirmed user + password session via the local Auth Admin API. */
export async function createAdminSession(email = uniqueTestEmail()) {
  const password = `E2e-${crypto.randomUUID()}-Aa1!`
  const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  })
  if (!createRes.ok) {
    throw new Error(`Admin create user failed: ${createRes.status} ${await createRes.text()}`)
  }

  const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })
  if (!tokenRes.ok) {
    throw new Error(`Password grant failed: ${tokenRes.status} ${await tokenRes.text()}`)
  }
  const created = (await createRes.json()) as { id?: string }
  const session = (await tokenRes.json()) as AuthSession
  if (!session.access_token || !session.refresh_token) {
    throw new Error('Password grant returned no tokens')
  }
  if (!session.expires_at && session.expires_in) {
    session.expires_at = Math.floor(Date.now() / 1000) + session.expires_in
  }
  const userId = (session.user as { id?: string } | undefined)?.id || created.id
  if (!userId) {
    throw new Error('Admin session had no user id')
  }
  return { email, userId, session }
}

/** Inject a session so the next navigation hydrates as signed in. */
export async function seedAdminSession(page: Page, email = uniqueTestEmail()) {
  const { email: used, userId, session } = await createAdminSession(email)
  await page.addInitScript(
    ({ key, sess }) => {
      localStorage.setItem(key, JSON.stringify(sess))
    },
    { key: AUTH_STORAGE_KEY, sess: session },
  )
  return { email: used, userId }
}

/** Seed a session and wait for the nav to show Manage Account (reloads if already on a page). */
export async function signInWithAdminSession(page: Page, email = uniqueTestEmail()) {
  const seeded = await seedAdminSession(page, email)
  const url = page.url()
  if (url && url !== 'about:blank') {
    await page.reload({ waitUntil: 'domcontentloaded' })
  }
  await expect(manageAccountButton(page)).toBeVisible({ timeout: 15_000 })
  return seeded
}
