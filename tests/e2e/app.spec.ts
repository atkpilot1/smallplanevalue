import { test, expect, type Page } from '@playwright/test'

/**
 * These tests exercise every user interaction in the ported single-page app.
 * All `/api/*` network calls are mocked so the tests are deterministic and do
 * not require Anthropic / Supabase credentials. The UI/markup is the verbatim
 * port of the original index.html served from server/assets/page.html.
 */

const FAA_RECORD = {
  found: true,
  _realData: true,
  _source: 'supabase',
  nnumber: 'N172SP',
  status: 'Valid',
  make: 'Cessna',
  model: '172S',
  year: 2004,
  serialNumber: '172S9999',
  aircraftType: 'Fixed wing single-engine',
  engineType: 'Reciprocating',
  engineMake: 'Lycoming',
  engineModel: 'IO-360-L2A',
  horsepower: 180,
  seats: 4,
  speed: 124,
  numEngines: 1,
  weightClass: 'CLASS 1',
  certDate: '20040115',
  airworthDate: '20040115',
  registrationExpiry: '2026-01-31',
  registrantName: 'Skyhawk LLC',
  city: 'Wichita',
  state: 'KS',
  statusCode: 'V'
}

async function mockApis(page: Page) {
  await page.route('**/api/faa-lookup', (route) =>
    route.fulfill({ json: FAA_RECORD })
  )

  await page.route('**/api/parse-listing', (route) =>
    route.fulfill({
      json: {
        make: 'Cessna',
        model: '172S',
        year: 2004,
        ttaf: 3200,
        engines: 1,
        smoh: 850,
        smohR: null,
        propHrs: null,
        propHrsR: null,
        condition: 'good',
        cosmetics: 'average',
        avionics: ['Garmin G1000'],
        notes: 'No damage history'
      }
    })
  )

  await page.route('**/api/valuate', (route) =>
    route.fulfill({
      json: {
        sellerAsk: 320000,
        fairMarketValue: 295000,
        buyerTarget: 280000,
        condImpact: '+2%',
        avImpact: '+5%',
        engineImpact: '-3%',
        condVerdict: 'Above average',
        avVerdict: 'Modern glass premium',
        engineVerdict: 'Mid-time engine',
        keyFinding: 'Priced slightly above market',
        analysis: 'This aircraft is well equipped and fairly priced for the market.',
        confidence: 'high',
        negotiatingTips: ['Ask for recent annual', 'Verify SMOH logs']
      }
    })
  )

  await page.route('**/api/comps', (route) =>
    route.fulfill({
      json: {
        summary: 'Active listings show steady demand for the 172S.',
        askLow: 250000,
        askMid: 295000,
        askHigh: 360000,
        avgDaysListed: 45,
        activeListings: 18,
        negotiationNote: 'Most sell within 5% of asking.',
        listings: [
          { year: 2004, ttaf: 3200, smoh: 850, ask: 295000, daysListed: 30, cond: 'Good', avionics: 'G1000' },
          { year: 2006, ttaf: 2800, smoh: 600, ask: 320000, daysListed: 21, cond: 'Excellent', avionics: 'G1000 NXi' }
        ]
      }
    })
  )

  await page.route('**/api/checklist', (route) =>
    route.fulfill({
      json: [
        { name: 'Firewall SB05-1 inspection', note: 'Check for cracking per Cessna SB', critical: true },
        { name: 'Seat rail AD 2011-10-09', note: 'Inspect seat rails and locking pins', critical: true }
      ]
    })
  )

  await page.route('**/api/feedback', (route) => route.fulfill({ json: { ok: true } }))
}

test.beforeEach(async ({ page }) => {
  await mockApis(page)
  await page.goto('/')
})

test('page renders with the expected title and hero', async ({ page }) => {
  await expect(page).toHaveTitle(/SmallPlaneValue/)
  await expect(page.locator('#tab-btn-lookup')).toBeVisible()
})

test('tab switching activates each pane', async ({ page }) => {
  const tabs = ['val', 'comps', 'checklist', 'sold', 'feedback', 'lookup']
  for (const id of tabs) {
    await page.locator(`#tab-btn-${id}`).click()
    await expect(page.locator(`#pane-${id}`)).toHaveClass(/active/)
  }
})

test('N-number lookup renders the FAA record', async ({ page }) => {
  await page.locator('#nn').fill('172SP')
  await page.locator('#nn-btn').click()
  const result = page.locator('#nn-result')
  await expect(result).toContainText('Cessna')
  await expect(result).toContainText('172S')
  await expect(result).toContainText('Skyhawk LLC')
  await expect(result).toContainText('Lycoming')
})

test('example N-number buttons trigger a lookup', async ({ page }) => {
  await page.getByRole('button', { name: 'C182' }).click()
  await expect(page.locator('#nn-result')).toContainText('Cessna')
})

test('parse listing auto-fills the valuation form', async ({ page }) => {
  await page.locator('#tab-btn-val').click()
  await page.locator('#v-paste').fill('2004 Cessna 172S, 3200 TTAF, G1000, no damage history')
  await page.locator('#paste-btn').click()
  await expect(page.locator('#v-make')).toHaveValue('Cessna')
  await expect(page.locator('#v-model')).toHaveValue('172S')
  await expect(page.locator('#v-year')).toHaveValue('2004')
})

test('valuation renders the appraisal result', async ({ page }) => {
  await page.locator('#tab-btn-val').click()
  await page.locator('#v-make').fill('Cessna')
  await page.locator('#v-model').fill('172S')
  await page.locator('#v-year').fill('2004')
  await page.locator('#v-btn').click()
  const result = page.locator('#v-result')
  await expect(result).toContainText('$295,000')
  await expect(result).toContainText('$320,000')
  await expect(result).toContainText('$280,000')
})

test('market comps renders listing ranges', async ({ page }) => {
  await page.locator('#tab-btn-comps').click()
  await page.locator('#c-model').fill('Cessna 172S')
  await page.locator('#c-btn').click()
  const result = page.locator('#c-result')
  await expect(result).toContainText('$295,000')
  await expect(result).toContainText('45d')
})

test('checklist generates items including model-specific entries', async ({ page }) => {
  await page.locator('#tab-btn-checklist').click()
  await page.locator('#cl-make').fill('Cessna')
  await page.locator('#cl-model').fill('172S')
  await page.locator('#cl-year').fill('2004')
  await page.locator('#cl-btn').click()
  const result = page.locator('#cl-result')
  await expect(result).toContainText('172S Specific Items')
  await expect(result).toContainText('Seat rail AD 2011-10-09')
})

test('report a sale validates required fields', async ({ page }) => {
  await page.locator('#tab-btn-sold').click()
  await page.locator('#sd-btn').click()
  await expect(page.locator('#sd-result')).toContainText('at least make, model, year')
})

test('report a sale stores submission in localStorage and renders recent sales', async ({ page }) => {
  await page.locator('#tab-btn-sold').click()
  await page.locator('#sd-make').fill('Cessna')
  await page.locator('#sd-model').fill('172S')
  await page.locator('#sd-year').fill('2004')
  await page.locator('#sd-price').fill('135000')
  await page.locator('#sd-ask').fill('159000')
  await page.locator('#sd-agree').check()
  await page.locator('#sd-btn').click()

  await expect(page.locator('#sd-result')).toContainText('Sale data submitted')
  await expect(page.locator('#sd-recent')).toContainText('2004 Cessna 172S')

  const stored = await page.evaluate(() => localStorage.getItem('spv_sold'))
  expect(stored).toBeTruthy()
  const arr = JSON.parse(stored as string)
  expect(arr[0]).toMatchObject({ make: 'Cessna', model: '172S', year: 2004, price: 135000 })
})

test('feedback submit shows thank-you and backs up to localStorage', async ({ page }) => {
  await page.locator('#tab-btn-feedback').click()
  await page.locator('#fb-aircraft').fill('1981 Beech B58 Baron')
  await page.locator('#fb-message').fill('Great tool, very accurate.')
  await page.locator('#fb-btn').click()

  await expect(page.locator('#fb-result')).toContainText('Thank you for your feedback')

  const stored = await page.evaluate(() => localStorage.getItem('spv_feedback'))
  expect(stored).toBeTruthy()
  const arr = JSON.parse(stored as string)
  expect(arr[arr.length - 1]).toMatchObject({ message: 'Great tool, very accurate.' })
})
