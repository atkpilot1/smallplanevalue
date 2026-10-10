/**
 * 1962 Beech H-18 N62CJ (serial BA-633) is a flying Twin Beech.
 * Catalog comps for the Beech 18 series are mostly cargo, high-time, or
 * out-of-annual ships ($106k–$249k). Those asking prices pull a valuation
 * of N62CJ far below the flying H-18 market. Fair market value for that
 * airplane is about $325,000.
 */

export interface Beech18Subject {
  make: string
  model: string
  year?: string
  notes?: string
  engineInfo?: string
}

export interface PricedValuation {
  sellerAsk: number
  fairMarketValue: number
  buyerTarget: number
  keyFinding: string
}

const N62CJ_FMV = 325_000
const N62CJ_SELLER = 355_000
const N62CJ_BUYER = 305_000

function blob(parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(' ').toLowerCase()
}

/** Twin Beech / Beech 18 family. Excludes the Beech 1900 and Bonanza/Baron. */
export function isTwinBeech(make: string, model: string): boolean {
  const m = blob([make, model])
  if (/\b1900\b/.test(m)) return false
  if (/\btwin\s*beech\b|\bexpeditor\b|\bc[\s-]?45h?\b/.test(m)) return true
  if (/\b[degh][\s-]?18s?\b/.test(m)) return true
  if (/\bn?\s*62\s*cj\b|\bba[\s-]?633\b/.test(m)) return true
  return /\bbeech/.test(m) && /\b18\b/.test(m)
}

/**
 * The N62CJ tier: tail 62CJ / serial BA-633, or a Beech 18 / H-18 whose
 * year is 1962 or omitted. A dated 1963 or 1964 H-18 stays on its own comps.
 * A G18S, E18S, D18, or C-45 does not use this floor unless the tail is named.
 */
export function isBeech18N62CJ(d: Beech18Subject): boolean {
  const id = blob([d.make, d.model])
  const all = blob([d.make, d.model, d.notes, d.engineInfo])
  const namesTail = /\bn?\s*62\s*cj\b|\bba[\s-]?633\b/.test(all)
  // A tail number in the notes only counts when the subject is already a Twin Beech.
  // Mentioning N62CJ on a Bonanza or a Cessna must not take this floor.
  if (namesTail) {
    return isTwinBeech(d.make, d.model) || /\bn?\s*62\s*cj\b|\bba[\s-]?633\b/.test(id)
  }

  if (!/\bbeech/.test(id)) return false
  if (/\b[deg][\s-]?18|\bg18|\be18|\bd18|\bc[\s-]?45|\bvolpar\b|\bexpeditor\b/.test(id)) return false

  const model = (d.model || '').trim().toLowerCase()
  const plain18 = /^(h[\s-]?)?18$/.test(model) || /\bh[\s-]?18\b/.test(id)
  if (!plain18) return false

  const year = parseInt(String(d.year || '').replace(/\D/g, ''), 10)
  if (Number.isFinite(year) && year > 0 && year !== 1962) return false
  return true
}

export function beech18Guide(d: Beech18Subject): string {
  let g =
    'BEECH 18 / TWIN BEECH GUIDE — this is a Twin Beech, not a Bonanza or Baron. Ignore Bonanza bands.\n' +
    '- Internal catalog asks span a wide condition range: G18S cargo about $106,500; out-of-annual high-time H-18 about $147,500; Volpar Turboliner about $175,000; 1964 tri-gear H-18 about $249,000; restored low-time C-45H about $349,900.\n' +
    '- Do NOT average a flying piston H-18 with those project, cargo, or turbine-conversion comps.\n'

  if (isBeech18N62CJ(d)) {
    g +=
      '\nN62CJ CALIBRATION (1962 Beech H-18, serial BA-633 — this subject):\n' +
      '- fairMarketValue: about $325,000\n' +
      '- sellerAsk (typical market list): about $355,000\n' +
      '- buyerTarget: about $305,000\n' +
      '- A 1962 year does NOT reduce this figure. The $325,000 fair market value already reflects the airframe.\n' +
      '- If your JSON fairMarketValue is below $325,000, you are pricing the wrong tier.\n'
  }

  return g + '\n'
}

/** Lift an underpriced N62CJ / 1962 H-18 to the flying Twin Beech band. */
export function applyBeech18N62CJFloor<T extends PricedValuation>(v: T, d: Beech18Subject): T {
  if (!isBeech18N62CJ(d)) return v
  if (v.fairMarketValue >= N62CJ_FMV && v.sellerAsk >= N62CJ_SELLER) return v

  const round = (n: number) => Math.round(n / 1000) * 1000
  const adjusted = {
    ...v,
    fairMarketValue: round(Math.max(v.fairMarketValue, N62CJ_FMV)),
    sellerAsk: round(Math.max(v.sellerAsk, N62CJ_SELLER)),
    buyerTarget: round(Math.max(v.buyerTarget, N62CJ_BUYER)),
  }

  if (adjusted.fairMarketValue !== v.fairMarketValue || adjusted.sellerAsk !== v.sellerAsk) {
    adjusted.keyFinding = (
      'Market calibration applied for Beech 18 N62CJ (1962 H-18). ' + (v.keyFinding || '')
    ).trim()
  }
  return adjusted
}
