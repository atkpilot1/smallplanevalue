import { expect, type Locator, type Page } from '@playwright-backend-mocks/playwright'

/**
 * Locators prefer what a user sees: roles, labels, and button names.
 * data-testid is only for result regions that wrap mixed copy.
 * Keep these names when the UI moves to Nuxt components.
 */

/** Public local Supabase defaults (same as `.env.example`). */
export const LOCAL_SUPABASE = {
  url: process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
  anon:
    process.env.SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  serviceRole:
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
}

/** Mocked AI baseline before post-AI adjustments. */
export const AI_BASELINE = {
  sellerAsk: 320_000,
  fairMarketValue: 295_000,
  buyerTarget: 280_000,
}

export const TABS = {
  lookup: 'N-number lookup',
  val: 'Get valuation',
  comps: 'Market listings',
  checklist: 'Pre-buy checklist',
  sold: 'Report a sale',
  feedback: 'Feedback',
} as const

export type TabId = keyof typeof TABS

export function usd(n: number) {
  return '$' + Math.round(n).toLocaleString('en-US')
}

export async function openApp(page: Page, path = '/') {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
}

export async function expectAlert(page: Page, click: () => Promise<void>, message: string) {
  const dialogP = page.waitForEvent('dialog')
  const clickP = click()
  const dialog = await dialogP
  expect(dialog.message()).toContain(message)
  await dialog.dismiss()
  await clickP
}

export function tab(page: Page, id: TabId) {
  return page.getByRole('tab', { name: TABS[id] })
}

export function pane(page: Page, id: TabId) {
  return page.getByTestId(`pane-${id}`)
}

export function lookupResult(page: Page) {
  return page.getByTestId('lookup-result')
}

export function valuationResult(page: Page) {
  return page.getByTestId('valuation-result')
}

export function compsResult(page: Page) {
  return page.getByTestId('comps-result')
}

export function checklistResult(page: Page) {
  return page.getByTestId('checklist-result')
}

export function soldResult(page: Page) {
  return page.getByTestId('sold-result')
}

export function soldRecent(page: Page) {
  return page.getByTestId('sold-recent')
}

export function feedbackResult(page: Page) {
  return page.getByTestId('feedback-result')
}

export function appToast(page: Page) {
  return page.getByRole('status')
}

/** Case-insensitive exact label. Playwright's `{ exact: true }` is case-sensitive. */
export function field(root: Page | Locator, name: string | RegExp) {
  if (typeof name !== 'string') return root.getByLabel(name)
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return root.getByLabel(new RegExp(`^${escaped}$`, 'i'))
}

/** Itemized avionics live inside a collapsed disclosure. */
export async function openAvionics(page: Page) {
  await pane(page, 'val').getByText(/itemize for precision/i).click()
}

export async function checkAvionics(page: Page, name: string) {
  await openAvionics(page)
  await pane(page, 'val').getByRole('checkbox', { name, exact: true }).check()
}

export async function openTab(page: Page, id: TabId) {
  await tab(page, id).click()
  await expect(tab(page, id)).toHaveAttribute('aria-selected', 'true')
}

export async function lookupN(page: Page, nnumber: string) {
  await openTab(page, 'lookup')
  await field(pane(page, 'lookup'), 'N-number').fill(nnumber)
  await pane(page, 'lookup').getByRole('button', { name: 'Look up' }).click()
}

export async function fillValuation(
  page: Page,
  fields: {
    make: string
    model: string
    year?: string
    smoh?: string
    smohL?: string
    smohR?: string
    engines?: '1' | '2'
    outOfAnnual?: boolean
    logbooks?: string
    damage?: string
    avionicsPackage?: string
    conversion?: string
    asking?: string
    notes?: string
  },
) {
  await openTab(page, 'val')
  const form = pane(page, 'val')
  await field(form, 'Make').fill(fields.make)
  await field(form, 'Model').fill(fields.model)
  if (fields.year) await field(form, 'Year').fill(fields.year)
  if (fields.engines) await field(form, 'Engines').selectOption(fields.engines)
  if (fields.smoh != null) await field(form, 'Engine SMOH (hrs)').fill(fields.smoh)
  if (fields.smohL != null) await field(form, 'Left engine SMOH (hrs)').fill(fields.smohL)
  if (fields.smohR != null) await field(form, 'Right engine SMOH (hrs)').fill(fields.smohR)
  if (fields.outOfAnnual) await form.getByRole('checkbox', { name: 'Out of annual' }).check()
  if (fields.logbooks) await field(form, 'Logbooks').selectOption(fields.logbooks)
  if (fields.damage) await field(form, 'Damage history').selectOption(fields.damage)
  if (fields.avionicsPackage) await field(form, 'Avionics panel').selectOption(fields.avionicsPackage)
  if (fields.conversion) await field(form, /engine conversion/i).fill(fields.conversion)
  if (fields.asking) await field(form, 'Asking price ($)').fill(fields.asking)
  if (fields.notes) await field(form, /^notes/i).fill(fields.notes)
}

/** Mid-time on the default 2,000 hr TBO — engineAdjustment is $0. */
export async function fillMidtimeValuation(
  page: Page,
  fields: { make?: string; model?: string; year?: string } & Omit<
    Parameters<typeof fillValuation>[1],
    'make' | 'model' | 'smoh'
  > = {},
) {
  await fillValuation(page, {
    make: fields.make || 'Cessna',
    model: fields.model || '172S',
    year: fields.year || '2004',
    smoh: '1000',
    ...fields,
  })
}

export async function submitValuation(page: Page) {
  await pane(page, 'val').getByRole('button', { name: 'Get honest valuation' }).click()
  await expect(valuationResult(page)).toContainText('AIRCRAFT VALUATION', { timeout: 20_000 })
}

export async function expectValuationDollars(page: Page, fmv: number, ask: number, buyer: number) {
  const result = valuationResult(page)
  await expect(result).toContainText(usd(fmv))
  await expect(result).toContainText(usd(ask))
  await expect(result).toContainText(usd(buyer))
}

const SNAPSHOT_STABILIZE_CSS = `
html { scroll-behavior: auto !important; }
*, *::before, *::after {
  animation: none !important;
  transition: none !important;
  caret-color: transparent !important;
}
.reveal, .reveal.visible {
  opacity: 1 !important;
  transform: none !important;
}
* { scrollbar-width: none !important; }
*::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
`

/** Kill motion, wait for webfonts/images, force scroll-reveal visible. */
export async function prepareSnapshot(page: Page) {
  await page.addStyleTag({ content: SNAPSHOT_STABILIZE_CSS })
  await page.evaluate(async () => {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'))
    await document.fonts.ready
    await Promise.all([
      document.fonts.load('16px "DM Sans"'),
      document.fonts.load('700 72px "Bebas Neue"'),
      document.fonts.load('16px "DM Mono"'),
    ])
    await Promise.all(
      Array.from(document.images).map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.addEventListener('load', () => resolve(), { once: true })
              img.addEventListener('error', () => resolve(), { once: true })
            }),
      ),
    )
  })
}

export async function expectShot(
  locator: Locator,
  name: string,
  opts: { hideFixedNav?: boolean } = {},
) {
  const page = locator.page()
  if (opts.hideFixedNav) {
    await page.locator('nav').evaluate((el) => {
      (el as HTMLElement).style.visibility = 'hidden'
    })
  }
  try {
    await expect(locator).toHaveScreenshot(`${name}.png`)
  } finally {
    if (opts.hideFixedNav) {
      await page.locator('nav').evaluate((el) => {
        (el as HTMLElement).style.visibility = ''
      })
    }
  }
}

export async function expectAria(locator: Locator, name: string) {
  await expect(locator).toMatchAriaSnapshot({ name })
}

async function supabaseAdminRest<T>(path: string): Promise<T> {
  const res = await fetch(`${LOCAL_SUPABASE.url}/rest/v1/${path}`, {
    headers: {
      apikey: LOCAL_SUPABASE.serviceRole,
      Authorization: `Bearer ${LOCAL_SUPABASE.serviceRole}`,
    },
  })
  if (!res.ok) throw new Error(`Supabase admin query failed: ${res.status} ${await res.text()}`)
  return (await res.json()) as T
}

export async function fetchUsageEvents(clientId: string) {
  const path =
    `usage_events?client_id=eq.${encodeURIComponent(clientId)}&feature=eq.valuate` +
    `&select=id,feature,metadata,client_id,user_id`
  return supabaseAdminRest<
    Array<{ id: string; feature: string; client_id: string; user_id: string | null; metadata: unknown }>
  >(path)
}

export type ProfileRow = {
  user_id: string
  valuation_count: number
  credit_balance: number
}

export async function fetchProfile(userId: string) {
  const rows = await supabaseAdminRest<ProfileRow[]>(
    `profiles?user_id=eq.${encodeURIComponent(userId)}&select=user_id,valuation_count,credit_balance`,
  )
  return rows[0] ?? null
}

export async function setProfile(
  userId: string,
  fields: { valuation_count?: number; credit_balance?: number },
) {
  const res = await fetch(
    `${LOCAL_SUPABASE.url}/rest/v1/profiles?user_id=eq.${encodeURIComponent(userId)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: LOCAL_SUPABASE.serviceRole,
        Authorization: `Bearer ${LOCAL_SUPABASE.serviceRole}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(fields),
    },
  )
  if (!res.ok) throw new Error(`setProfile failed: ${res.status} ${await res.text()}`)
}
