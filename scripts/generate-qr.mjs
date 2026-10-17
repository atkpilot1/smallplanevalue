#!/usr/bin/env node
/**
 * Generate print-ready QR assets for smallplanevalue.com.
 *
 *   node scripts/generate-qr.mjs
 *   node scripts/generate-qr.mjs --url https://smallplanevalue.com/?utm_source=qr
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const QRCode = (await import('qrcode').catch(() => null))?.default
if (!QRCode) {
  console.error('Missing qrcode. Install it with: npm install -D qrcode')
  process.exit(1)
}

const SKY = '#0B2545'
const ACCENT = '#E8A020'
const WHITE = '#F7F5F0'
const DEFAULT_URL = 'https://smallplanevalue.com'

function argValue(flag) {
  const i = process.argv.indexOf(flag)
  return i === -1 ? undefined : process.argv[i + 1]
}

const url = argValue('--url') || DEFAULT_URL
const outDir = argValue('--out') || join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const qr = QRCode.create(url, { errorCorrectionLevel: 'H' })
const n = qr.modules.size

function moduleDark(x, y) {
  if (typeof qr.modules.get === 'function') return Boolean(qr.modules.get(x, y))
  return Boolean(qr.modules.data ? qr.modules.data[y * n + x] : qr.modules[y][x])
}

function qrPath() {
  const parts = []
  for (let y = 0; y < n; y++) {
    let x = 0
    while (x < n) {
      if (!moduleDark(x, y)) {
        x++
        continue
      }
      let w = 1
      while (x + w < n && moduleDark(x + w, y)) w++
      parts.push(`M${x} ${y}h${w}v1h${-w}z`)
      x += w
    }
  }
  return parts.join('')
}

const margin = 4
const path = qrPath()
const view = n + margin * 2

const qrSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${view} ${view}" width="1024" height="1024" role="img" aria-label="QR code for ${escapeXml(url)}">
  <title>QR code for ${escapeXml(url)}</title>
  <rect width="${view}" height="${view}" fill="#FFFFFF"/>
  <g transform="translate(${margin} ${margin})" fill="${SKY}">
    <path d="${path}"/>
  </g>
</svg>
`

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
}

const planePath = 'M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z'

const cardW = 800
const cardH = 980
const qrBox = 520
const qrX = (cardW - qrBox) / 2
const qrY = 168
const innerPad = 36
const inner = qrBox - innerPad * 2
const scale = inner / view

const cardSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cardW} ${cardH}" width="${cardW}" height="${cardH}" role="img" aria-label="SmallPlaneValue.com QR code">
  <title>SmallPlaneValue.com — scan for a free aircraft valuation</title>
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&amp;family=DM+Sans:wght@300;500&amp;display=swap');
    </style>
  </defs>
  <rect width="${cardW}" height="${cardH}" rx="28" fill="${SKY}"/>
  <rect x="0" y="0" width="${cardW}" height="8" fill="${ACCENT}"/>
  <g transform="translate(56 56)">
    <rect width="52" height="52" rx="10" fill="${ACCENT}"/>
    <g transform="translate(8 8)" fill="${SKY}">
      <path d="${planePath}" transform="scale(1.5)"/>
    </g>
  </g>
  <text x="124" y="78" font-family="Bebas Neue, Arial Narrow, Impact, sans-serif" font-size="36" letter-spacing="1.2" fill="${WHITE}">SMALLPLANE<tspan fill="${ACCENT}">VALUE</tspan></text>
  <text x="124" y="104" font-family="DM Sans, Helvetica, Arial, sans-serif" font-size="13" font-weight="500" letter-spacing="2.4" fill="${ACCENT}">THE HONEST GA VALUATION TOOL</text>
  <rect x="${qrX}" y="${qrY}" width="${qrBox}" height="${qrBox}" rx="18" fill="#FFFFFF"/>
  <g transform="translate(${qrX + innerPad} ${qrY + innerPad}) scale(${scale.toFixed(4)})">
    <rect width="${view}" height="${view}" fill="#FFFFFF"/>
    <g transform="translate(${margin} ${margin})" fill="${SKY}">
      <path d="${path}"/>
    </g>
  </g>
  <text x="${cardW / 2}" y="748" text-anchor="middle" font-family="Bebas Neue, Arial Narrow, Impact, sans-serif" font-size="42" letter-spacing="1.6" fill="${WHITE}">SMALLPLANEVALUE.COM</text>
  <text x="${cardW / 2}" y="798" text-anchor="middle" font-family="DM Sans, Helvetica, Arial, sans-serif" font-size="20" font-weight="300" fill="rgba(247,245,240,0.72)">Know what your plane is worth.</text>
  <text x="${cardW / 2}" y="918" text-anchor="middle" font-family="DM Sans, Helvetica, Arial, sans-serif" font-size="14" font-weight="300" fill="rgba(247,245,240,0.45)">Scan for a free asking-price range · no fabricated sale prices</text>
</svg>
`

await mkdir(outDir, { recursive: true })
await writeFile(join(outDir, 'qr.svg'), qrSvg)
await writeFile(join(outDir, 'qr-card.svg'), cardSvg)

await QRCode.toFile(join(outDir, 'qr.png'), url, {
  errorCorrectionLevel: 'H',
  type: 'png',
  margin,
  width: 1024,
  color: { dark: SKY, light: '#FFFFFF' },
})

await QRCode.toFile(join(outDir, 'qr-print.png'), url, {
  errorCorrectionLevel: 'H',
  type: 'png',
  margin,
  width: 2048,
  color: { dark: SKY, light: '#FFFFFF' },
})

console.log(`QR modules: ${n}×${n}`)
console.log(`URL: ${url}`)
console.log(`Wrote:`)
console.log(`  ${join(outDir, 'qr.svg')}`)
console.log(`  ${join(outDir, 'qr.png')} (1024px)`)
console.log(`  ${join(outDir, 'qr-print.png')} (2048px)`)
console.log(`  ${join(outDir, 'qr-card.svg')} (branded poster)`)
