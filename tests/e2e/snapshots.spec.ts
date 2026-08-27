import { test, expect } from '@playwright-backend-mocks/playwright'
import { mockAnthropic } from './anthropic'
import { signInWithAdminSession } from './auth'
import {
  TABS,
  checklistResult,
  compsResult,
  expectAria,
  expectShot,
  feedbackResult,
  field,
  fillMidtimeValuation,
  lookupN,
  lookupResult,
  openAvionics,
  openTab,
  pane,
  prepareSnapshot,
  openApp,
  soldRecent,
  soldResult,
  submitValuation,
  valuationResult,
} from './helpers'

/**
 * Visual + ARIA baselines for the current HTML UI.
 * Keep region selectors (nav, .hero, #why, #how-it-works, #tools,
 * #aircraft-types, #app, .disclaimer, footer, and the pane/result test ids)
 * when the UI moves to Nuxt components.
 */
test.describe('snapshots', { tag: '@snapshot' }, () => {
  test.beforeEach(async ({ page, backendMocks }) => {
    await mockAnthropic(backendMocks)
    await page.addInitScript(() => {
      localStorage.removeItem('spv_sold')
      localStorage.removeItem('spv_feedback')
    })
    await openApp(page)
    await prepareSnapshot(page)
  })

  test('marketing chrome', async ({ page }) => {
    if (process.env.SNAPSHOT_REVIEW) {
      await page.locator('.hero-h1 .line2').evaluate((el) => {
        el.textContent = 'CHANGED FOR DIFF'
      })
    }
    await expectShot(page.locator('nav'), 'nav')
    await expectShot(page.locator('.hero'), 'hero')
    await expectShot(page.locator('#why'), 'why', { hideFixedNav: true })
    await expectShot(page.locator('#how-it-works'), 'how-it-works', { hideFixedNav: true })
    await expectShot(page.locator('#tools'), 'tools', { hideFixedNav: true })
    await expectShot(page.locator('#aircraft-types'), 'aircraft-types', { hideFixedNav: true })
    await expectShot(page.locator('.disclaimer'), 'disclaimer', { hideFixedNav: true })
    await expectShot(page.locator('footer'), 'footer', { hideFixedNav: true })
    await expectAria(page.locator('body'), 'page')
  })

  for (const id of Object.keys(TABS) as Array<keyof typeof TABS>) {
    test(`empty pane: ${id}`, async ({ page }) => {
      await openTab(page, id)
      await expectShot(page.locator('#app'), `pane-${id}`, { hideFixedNav: true })
      await expectAria(pane(page, id), `pane-${id}`)
    })
  }

  test('valuation avionics disclosure aria', async ({ page }) => {
    await openTab(page, 'val')
    await openAvionics(page)
    await expectAria(pane(page, 'val'), 'pane-val-avionics')
  })

  test('valuation pane variants', async ({ page }) => {
    await openTab(page, 'val')
    await field(pane(page, 'val'), 'Engines').selectOption('2')
    await expectShot(page.locator('#app'), 'pane-val-twin', { hideFixedNav: true })

    await field(pane(page, 'val'), 'Engines').selectOption('1')
    await field(pane(page, 'val'), 'Make').fill('Cirrus')
    await field(pane(page, 'val'), 'Model').fill('SR22')
    await field(pane(page, 'val'), 'Year').fill('2018')
    await expect(field(pane(page, 'val'), 'Cirrus generation')).toBeVisible()
    await expectShot(page.locator('#app'), 'pane-val-cirrus', { hideFixedNav: true })
  })

  test('lookup results', async ({ page }) => {
    await lookupN(page, '172SP')
    await expect(lookupResult(page)).toContainText(/cessna/i)
    await expectShot(lookupResult(page), 'lookup-result', { hideFixedNav: true })
    await expectAria(lookupResult(page), 'lookup-result')

    await lookupN(page, 'NOPE99')
    await expect(lookupResult(page)).toContainText('No aircraft found')
    await expectShot(lookupResult(page), 'lookup-not-found', { hideFixedNav: true })
  })

  test('valuation result', async ({ page }) => {
    await signInWithAdminSession(page)
    await prepareSnapshot(page)
    await fillMidtimeValuation(page, { asking: '340000' })
    await expect(page.getByTestId('engine-life')).toContainText(/TBO|life|SMOH/i)
    await expectShot(page.getByTestId('engine-life'), 'engine-life', { hideFixedNav: true })
    await submitValuation(page)
    await expectShot(valuationResult(page), 'valuation-result', { hideFixedNav: true })
    await expectAria(valuationResult(page), 'valuation-result')
  })

  test('comps result', async ({ page }) => {
    await openTab(page, 'comps')
    await field(pane(page, 'comps'), 'Make & model').fill('Cessna 172S')
    await pane(page, 'comps').getByRole('button', { name: 'Search asking prices' }).click()
    await expect(compsResult(page)).toContainText('active listings')
    await expectShot(compsResult(page), 'comps-result', { hideFixedNav: true })
    await expectAria(compsResult(page), 'comps-result')
  })

  test('checklist result', async ({ page }) => {
    await openTab(page, 'checklist')
    await field(pane(page, 'checklist'), 'Make').fill('Cessna')
    await field(pane(page, 'checklist'), 'Model').fill('172S')
    await field(pane(page, 'checklist'), 'Year').fill('2004')
    await pane(page, 'checklist').getByRole('button', { name: 'Generate inspection checklist' }).click()
    await expect(checklistResult(page)).toContainText('Documents and Records')
    await expectShot(checklistResult(page).locator('.cl-section').first(), 'checklist-section', { hideFixedNav: true })
    await expectAria(checklistResult(page), 'checklist-result')
  })

  test('sold and feedback results', async ({ page }) => {
    await openTab(page, 'sold')
    const sold = pane(page, 'sold')
    await field(sold, 'Aircraft make').fill('Cessna')
    await field(sold, 'Model').fill('172S')
    await field(sold, 'Year').fill('2004')
    await field(sold, 'Sale price ($)').fill('135000')
    await field(sold, 'Original asking price ($)').fill('159000')
    await sold.locator('#sd-date').fill('2025-11')
    await sold.getByRole('checkbox', { name: /I confirm this is a real transaction/ }).check()
    await sold.getByRole('button', { name: 'Submit sale data' }).click()
    await expect(soldResult(page)).toContainText('Sale data submitted')
    await expectShot(soldResult(page), 'sold-result', { hideFixedNav: true })
    await expectShot(soldRecent(page), 'sold-recent', { hideFixedNav: true })
    await expectAria(soldResult(page), 'sold-result')

    await openTab(page, 'feedback')
    const fb = pane(page, 'feedback')
    await field(fb, 'Aircraft').fill('2004 Cessna 172S')
    await field(fb, 'Your feedback').fill('Snapshot baseline')
    await fb.getByRole('button', { name: 'Send feedback' }).click()
    await expect(feedbackResult(page)).toContainText('Thank you')
    await expectShot(feedbackResult(page), 'feedback-result', { hideFixedNav: true })
  })

  test('tab names stay the published labels', async ({ page }) => {
    for (const [id, name] of Object.entries(TABS)) {
      await expect(page.getByRole('tab', { name })).toBeVisible()
      await expect(page.getByTestId(`pane-${id}`)).toHaveCount(1)
    }
  })
})
