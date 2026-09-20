import { test, expect } from './fixtures'
import { field, openApp, openTab, pane, soldRecent, soldResult } from './helpers'

test.beforeEach(async ({ page }) => {
  await openApp(page)
})

test('missing required fields shows the validation note', async ({ page }) => {
  await openTab(page, 'sold')
  await pane(page, 'sold').getByRole('button', { name: 'Submit sale data' }).click()
  await expect(soldResult(page)).toContainText('at least make, model, year')
})

test('parse sale post auto-fills the form', async ({ page }) => {
  await openTab(page, 'sold')
  const form = pane(page, 'sold')
  await field(form, 'Paste a sale post').fill('SOLD 1998 Beechcraft A36 for $285k, was asking $310k, 4200 TT, 650 SMOH')
  await form.getByRole('button', { name: 'Auto-fill from post' }).click()
  await expect(field(form, 'Aircraft make')).toHaveValue('Beechcraft')
  await expect(field(form, 'Model')).toHaveValue('A36')
  await expect(field(form, 'Year')).toHaveValue('1998')
  await expect(field(form, 'Sale price ($)')).toHaveValue('285000')
  await expect(field(form, 'Original asking price ($)')).toHaveValue('310000')
  await expect(soldResult(page)).toContainText('Fields filled from post')
})

test('submit stores localStorage and renders recent sales', async ({ page }) => {
  await openTab(page, 'sold')
  const form = pane(page, 'sold')
  await field(form, 'Aircraft make').fill('Cessna')
  await field(form, 'Model').fill('172S')
  await field(form, 'Year').fill('2004')
  await field(form, 'Sale price ($)').fill('135000')
  await field(form, 'Original asking price ($)').fill('159000')
  await form.getByRole('checkbox', { name: /I confirm this is a real transaction/ }).check()
  await form.getByRole('button', { name: 'Submit sale data' }).click()

  await expect(soldResult(page)).toContainText('Sale data submitted')
  await expect(soldRecent(page)).toContainText('2004 Cessna 172S')

  const stored = await page.evaluate(() => localStorage.getItem('spv_sold'))
  expect(stored).toBeTruthy()
  const arr = JSON.parse(stored as string)
  expect(arr[0]).toMatchObject({ make: 'Cessna', model: '172S', year: 2004, price: 135000 })
})

test('submit without the confirmation checkbox is blocked', async ({ page }) => {
  await openTab(page, 'sold')
  const form = pane(page, 'sold')
  await field(form, 'Aircraft make').fill('Cessna')
  await field(form, 'Model').fill('172S')
  await field(form, 'Year').fill('2004')
  await field(form, 'Sale price ($)').fill('135000')
  await form.getByRole('button', { name: 'Submit sale data' }).click()
  await expect(soldResult(page)).toContainText('Please check the confirmation box')
})

test('thank-you card shows discount vs asking price', async ({ page }) => {
  await openTab(page, 'sold')
  const form = pane(page, 'sold')
  await field(form, 'Aircraft make').fill('Cessna')
  await field(form, 'Model').fill('172S')
  await field(form, 'Year').fill('2004')
  await field(form, 'Sale price ($)').fill('135000')
  await field(form, 'Original asking price ($)').fill('159000')
  await form.getByRole('checkbox', { name: /I confirm this is a real transaction/ }).check()
  await form.getByRole('button', { name: 'Submit sale data' }).click()
  await expect(soldResult(page)).toContainText('Sale data submitted')
  await expect(soldResult(page)).toContainText('-15%')
  await expect(soldResult(page)).toContainText('vs. asking')
})

test('recent list caps at 10 and reports the overflow', async ({ page }) => {
  const extras = Array.from({ length: 11 }, (_, i) => ({
    id: i + 1,
    make: 'Cessna',
    model: '172S',
    year: 2000 + i,
    price: 100000 + i,
    ts: new Date().toISOString(),
  }))
  await page.evaluate((rows) => localStorage.setItem('spv_sold', JSON.stringify(rows)), extras)
  await openTab(page, 'sold')
  await expect(soldRecent(page)).toContainText('Showing 10 of 11 submissions')
  await expect(soldRecent(page)).toContainText('2000 Cessna 172S')
  await expect(soldRecent(page)).not.toContainText('2010 Cessna 172S')
})
