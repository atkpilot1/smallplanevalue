import { chromium } from '@playwright/test'
import { fileURLToPath } from 'url'
import path from 'path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const htmlPath = path.join(root, 'docs/smallplanevalue-launch-checklist.html')
const pdfPath = path.join(root, 'docs/smallplanevalue-launch-checklist.pdf')

const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' })
await page.pdf({
  path: pdfPath,
  format: 'Letter',
  printBackground: true,
  margin: { top: '0.5in', right: '0.6in', bottom: '0.5in', left: '0.6in' },
})
await browser.close()
console.log('Wrote', pdfPath)
