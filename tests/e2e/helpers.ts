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

export async function fetchUsageEvents(clientId: string) {
  const url =
    `${LOCAL_SUPABASE.url}/rest/v1/usage_events` +
    `?client_id=eq.${encodeURIComponent(clientId)}&feature=eq.valuate&select=id,feature,metadata,client_id`
  const res = await fetch(url, {
    headers: {
      apikey: LOCAL_SUPABASE.anon,
      Authorization: `Bearer ${LOCAL_SUPABASE.anon}`,
    },
  })
  if (!res.ok) throw new Error(`usage_events query failed: ${res.status} ${await res.text()}`)
  return (await res.json()) as Array<{ id: string; feature: string; client_id: string; metadata: unknown }>
}
