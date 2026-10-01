import { test, expect } from './fixtures'

test('QR image assets encode smallplanevalue.com', async ({ page }) => {
  const svg = await page.request.get('/qr.svg')
  expect(svg.ok()).toBeTruthy()
  const svgBody = await svg.text()
  expect(svgBody).toContain('<svg')
  expect(svgBody).toContain('https://smallplanevalue.com')

  const png = await page.request.get('/qr.png')
  expect(png.ok()).toBeTruthy()
  expect(png.headers()['content-type']).toMatch(/image\/png/)
  const pngBytes = Buffer.from(await png.body())
  expect(pngBytes.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))

  const poster = await page.request.get('/qr-card.svg')
  expect(poster.ok()).toBeTruthy()
  expect(await poster.text()).toContain('SMALLPLANEVALUE.COM')
})

test('print page shows the QR code and downloads', async ({ page }) => {
  await page.goto('/qr')
  await expect(page).toHaveTitle(/QR code/i)
  await expect(page.getByRole('heading', { name: /SmallPlaneValue/ })).toBeVisible()

  const img = page.getByRole('img', { name: /QR code linking to https:\/\/smallplanevalue.com/i })
  await expect(img).toBeVisible()
  await expect(img).toHaveAttribute('src', '/qr.svg')
  await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0)

  await expect(page.getByRole('link', { name: /^PNG$/ })).toHaveAttribute('href', '/qr.png')
  await expect(page.getByRole('link', { name: /^SVG$/ })).toHaveAttribute('href', '/qr.svg')
  await expect(page.getByRole('link', { name: /High-res PNG/ })).toHaveAttribute('href', '/qr-print.png')
  await expect(page.getByRole('link', { name: /Poster/ })).toHaveAttribute('href', '/qr-card.svg')
  await expect(page.getByRole('button', { name: /Print/ })).toBeVisible()
})
