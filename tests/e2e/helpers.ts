import { expect, type Page } from '@playwright-backend-mocks/playwright'

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

/** Itemized avionics live inside a collapsed <details>. */
export async function checkAvionics(page: Page, id: string) {
  await page.locator('details.adv-section').evaluate((el) => {
    (el as HTMLDetailsElement).open = true
  })
  await page.locator(`#${id}`).check({ force: true })
}

export async function openTab(page: Page, id: 'lookup' | 'val' | 'comps' | 'checklist' | 'sold' | 'feedback') {
  await page.locator(`#tab-btn-${id}`).click()
  await expect(page.locator(`#pane-${id}`)).toHaveClass(/active/)
}

export async function lookupN(page: Page, nnumber: string) {
  await openTab(page, 'lookup')
  await page.locator('#nn').fill(nnumber)
  await page.locator('#nn-btn').click()
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
  await page.locator('#v-make').fill(fields.make)
  await page.locator('#v-model').fill(fields.model)
  if (fields.year) await page.locator('#v-year').fill(fields.year)
  if (fields.engines) await page.locator('#v-engines').selectOption(fields.engines)
  if (fields.smoh != null) await page.locator('#v-smoh').fill(fields.smoh)
  if (fields.smohL != null) await page.locator('#v-smoh-l').fill(fields.smohL)
  if (fields.smohR != null) await page.locator('#v-smoh-r').fill(fields.smohR)
  if (fields.outOfAnnual) await page.locator('#v-out-of-annual').check()
  if (fields.logbooks) await page.locator('#v-logbooks').selectOption(fields.logbooks)
  if (fields.damage) await page.locator('#v-damage').selectOption(fields.damage)
  if (fields.avionicsPackage) await page.locator('#v-avionics-package').selectOption(fields.avionicsPackage)
  if (fields.conversion) await page.locator('#v-eng-conv').fill(fields.conversion)
  if (fields.asking) await page.locator('#v-asking').fill(fields.asking)
  if (fields.notes) await page.locator('#v-notes').fill(fields.notes)
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
  await page.locator('#v-btn').click()
  await expect(page.locator('#v-result')).toContainText('AIRCRAFT VALUATION', { timeout: 20_000 })
}

export async function expectValuationDollars(page: Page, fmv: number, ask: number, buyer: number) {
  const result = page.locator('#v-result')
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
