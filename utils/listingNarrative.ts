import type { EngineLifeState, ValuationResult } from '~/types/app'
import { fmt } from './format'

export function buildListingNarrative(
  listingAsk: number,
  fmv: number,
  buyer: number,
  marketAsk: number,
  v: ValuationResult,
  lastEngineLife: EngineLifeState | null,
) {
  const parts: string[] = []
  const drivers: string[] = []
  const el = lastEngineLife
  if (el && el.engines && el.engines.length) {
    let minLife = 100
    el.engines.forEach((e) => {
      const pct = e.life && e.life.pctRemaining != null
        ? e.life.pctRemaining
        : Math.max(0, Math.round((1 - e.smoh / e.tbo) * 100))
      if (pct < minLife) minLife = pct
      if (pct >= 55) drivers.push('low engine time (' + pct + '% TBO life remaining)')
    })
  }
  if (v.engineVerdict && /fresh/i.test(v.engineVerdict) && !drivers.length) {
    drivers.push('strong engine condition (' + v.engineVerdict + ')')
  }
  if (v.avVerdict && /above|modern|glass|premium/i.test(v.avVerdict)) {
    drivers.push('above-average avionics')
  }
  if (listingAsk > 0 && fmv > 0) {
    const gapD = listingAsk - fmv
    const gapPct = Math.round(gapD / fmv * 100)
    let verdict = ''
    if (gapPct > 20) {
      verdict = 'This listing looks ambitious relative to our estimate.'
      if (listingAsk >= 380000) {
        parts.push('Dealer listings in this range often carry a 12–20% premium over fair market — the ask is not always the value.')
      }
    } else if (gapPct > 10) verdict = 'This listing is priced toward the high end of the market.'
    else if (gapPct > 5) verdict = 'This listing is slightly above our fair market value.'
    else if (gapPct >= -5) verdict = 'This listing is roughly in line with our fair market value.'
    else verdict = 'This listing may offer good value below our estimate.'
    parts.push(
      verdict + ' The ask of ' + fmt(listingAsk) + ' is ' + fmt(Math.abs(gapD)) + ' (' +
      Math.abs(gapPct) + '%) ' + (gapPct >= 0 ? 'above' : 'below') + ' our ' + fmt(fmv) + ' fair market value.',
    )
    if (gapPct > 8 && drivers.length) {
      parts.push(
        'Even so, ' + drivers.join(' and ') +
        ' supports paying toward the top of the range — consider opening near ' + fmt(buyer) +
        ' and negotiating toward ' + fmt(fmv) + ' rather than the full ask.',
      )
    } else if (gapPct <= 8 && drivers.length) {
      parts.push('Key value drivers: ' + drivers.join(' and ') + '.')
    }
    if (marketAsk && Math.abs(marketAsk - listingAsk) > 5000) {
      parts.push('Typical comparable listings ask around ' + fmt(marketAsk) + '.')
    }
  } else if (fmv > 0) {
    parts.push('Our fair market value is ' + fmt(fmv) + ', with a buyer target near ' + fmt(buyer) + '.')
    if (marketAsk) parts.push('Similar aircraft are typically listed around ' + fmt(marketAsk) + '.')
    if (drivers.length) parts.push('This estimate reflects ' + drivers.join(' and ') + '.')
    parts.push('Enter a listing ask above to see how a specific price compares.')
  }
  return parts.join(' ')
}
