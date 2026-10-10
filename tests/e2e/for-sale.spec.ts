import { test, expect } from './fixtures'
import { expectAlert, field, openApp, openTab, pane } from './helpers'

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

test.beforeEach(async ({ page }) => {
  await openApp(page)
})

test('catalog count is the Trade-A-Plane series, not an invented number', async ({ request }) => {
  const cessna = await request.post('/api/for-sale-count', {
    data: { make: 'Cessna', model: '172S', year: '2004' },
  })
  expect(cessna.status()).toBe(200)
  const body = await cessna.json()
  expect(body.count).toBe(216)
  expect(body.pricedCount).toBe(145)
  expect(body.sameYearCount).toBe(1)
  expect(body.series).toEqual(['CESSNA 172 SERIES'])
  expect(body.label).toBe('Cessna 172')

  const turbo = await request.post('/api/for-sale-count', {
    data: { make: 'Cessna', model: 'T182' },
  })
  expect((await turbo.json()).series).toEqual(['CESSNA 182 TURBO SERIES'])

  const baron = await request.post('/api/for-sale-count', {
    data: { make: 'Beech', model: 'Baron 58' },
  })
  expect((await baron.json()).series).toEqual(['BEECHCRAFT 58 BARON SERIES'])

  const rv = await request.post('/api/for-sale-count', {
    data: { make: "Van's", model: 'RV-10' },
  })
  const rvBody = await rv.json()
  expect(rvBody.count).toBe(5)
  expect(rvBody.series).toEqual([])

  const missing = await request.post('/api/for-sale-count', {
    data: { make: 'Cessna', model: 'Notaplane' },
  })
  expect((await missing.json()).count).toBe(0)
})

test('valuation form shows how many similar aircraft are for sale', async ({ page }) => {
  await openTab(page, 'val')
  const form = pane(page, 'val')
  await field(form, 'Make').fill('Cessna')
  await field(form, 'Model').fill('172S')
  const note = form.getByTestId('for-sale-count')
  await expect(note).toContainText('216', { timeout: 10_000 })
  await expect(note).toContainText('Cessna 172 are for sale')
  await expect(note).toContainText('145 list an asking price')
  await field(form, 'Year').fill('2004')
  await expect(note).toContainText('1 is listed as 2004')
})

test('comps form shows the catalog count for the model being searched', async ({ page }) => {
  await openTab(page, 'comps')
  const form = pane(page, 'comps')
  await field(form, 'Make & model').fill('Cirrus SR22')
  const note = form.getByTestId('for-sale-count')
  await expect(note).toContainText('158', { timeout: 10_000 })
  await expect(note).toContainText('Cirrus SR22 are for sale')
})

test('screenshot auto-fills the same fields as pasted text', async ({ page }) => {
  await openTab(page, 'val')
  const form = pane(page, 'val')
  await form.locator('#v-paste-file').setInputFiles({
    name: 'listing.png',
    mimeType: 'image/png',
    buffer: TINY_PNG,
  })
  await expect(form.getByTestId('listing-screenshot')).toBeVisible()
  await expect(form.getByRole('img', { name: 'Listing screenshot preview' })).toBeVisible()
  await form.getByRole('button', { name: 'Auto-fill from listing' }).click()
  await expect(field(form, 'Make')).toHaveValue('Cessna')
  await expect(field(form, 'Model')).toHaveValue('172S')
  await expect(field(form, 'Year')).toHaveValue('2004')
  await expect(form.getByTestId('for-sale-count')).toContainText('216')
  await expect(form.getByTestId('for-sale-count')).toContainText('for sale')
})

test('auto-fill without text or a screenshot alerts the user', async ({ page }) => {
  await openTab(page, 'val')
  const form = pane(page, 'val')
  await expectAlert(
    page,
    () => form.getByRole('button', { name: 'Auto-fill from listing' }).click(),
    'Paste a listing or add a screenshot first.',
  )
})

test('parse-listing accepts a screenshot and still accepts text', async ({ request }) => {
  const shot = await request.post('/api/parse-listing', {
    data: {
      image: {
        mediaType: 'image/png',
        data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      },
    },
  })
  expect(shot.status()).toBe(200)
  const parsed = await shot.json()
  expect(parsed.make).toBe('Cessna')
  expect(parsed.model).toBe('172S')

  const text = await request.post('/api/parse-listing', {
    data: { text: '2004 Cessna 172S' },
  })
  expect(text.status()).toBe(200)

  const empty = await request.post('/api/parse-listing', { data: {} })
  expect(empty.status()).toBe(400)
})
