/**
 * TBO (recommended overhaul interval) by engine model.
 * Sources: Lycoming/Continental service instructions; typical GA listings.
 * Used for engine-life % remaining in valuation UI.
 */

export interface EngineSpec {
  tbo: number
  overhaulCost: number
  /** How the match was resolved */
  matchType: 'exact' | 'prefix' | 'family' | 'default'
  matchedKey: string
}

/** Exact FAA engine model → TBO hours */
const EXACT: Record<string, { tbo: number; overhaulCost?: number }> = {
  // Lycoming — singles
  'O-320-A1A': { tbo: 2000, overhaulCost: 28000 },
  'O-320-A2B': { tbo: 2000, overhaulCost: 28000 },
  'O-320-A2C': { tbo: 2000, overhaulCost: 28000 },
  'O-320-A3B': { tbo: 2000, overhaulCost: 28000 },
  'O-320-D2A': { tbo: 2000, overhaulCost: 28000 },
  'O-320-D2B': { tbo: 2000, overhaulCost: 28000 },
  'O-320-D2G': { tbo: 2000, overhaulCost: 28000 },
  'O-320-E2A': { tbo: 2000, overhaulCost: 28000 },
  'O-320-E2D': { tbo: 2000, overhaulCost: 28000 },
  'O-320-E2G': { tbo: 2000, overhaulCost: 28000 },
  'O-320-H2AD': { tbo: 2000, overhaulCost: 28000 },
  'IO-320-A1A': { tbo: 2000, overhaulCost: 32000 },
  'O-360-A1A': { tbo: 2000, overhaulCost: 32000 },
  'O-360-A1F6': { tbo: 2000, overhaulCost: 32000 },
  'O-360-A3A': { tbo: 2000, overhaulCost: 32000 },
  'O-360-A4A': { tbo: 2000, overhaulCost: 32000 },
  'O-360-A4M': { tbo: 2000, overhaulCost: 32000 },
  'O-360-C1E': { tbo: 2000, overhaulCost: 32000 },
  'IO-360-A1B6': { tbo: 2000, overhaulCost: 36000 },
  'IO-360-A1B6D': { tbo: 2000, overhaulCost: 36000 },
  'IO-360-A1C6': { tbo: 2000, overhaulCost: 36000 },
  'IO-360-C1C6': { tbo: 2000, overhaulCost: 36000 },
  'IO-360-C1E6': { tbo: 2000, overhaulCost: 36000 },
  'IO-360-C1G6': { tbo: 2000, overhaulCost: 36000 },
  'IO-390-C3B6': { tbo: 2000, overhaulCost: 42000 },
  'O-540-A1A5': { tbo: 2000, overhaulCost: 42000 },
  'O-540-B1B5': { tbo: 2000, overhaulCost: 42000 },
  'O-540-B2B5': { tbo: 2000, overhaulCost: 42000 },
  'O-540-B4B5': { tbo: 2000, overhaulCost: 42000 },
  'IO-540-A1A5': { tbo: 2000, overhaulCost: 48000 },
  'IO-540-C4B5': { tbo: 2000, overhaulCost: 48000 },
  'IO-540-D4A5': { tbo: 2000, overhaulCost: 48000 },
  'IO-540-K1G5': { tbo: 2000, overhaulCost: 48000 },
  'IO-540-K1J5': { tbo: 2000, overhaulCost: 48000 },
  'IO-540-K1K5': { tbo: 2000, overhaulCost: 48000 },
  'IO-540-K1L5': { tbo: 2000, overhaulCost: 48000 },
  'IO-540-M1B5': { tbo: 2000, overhaulCost: 48000 },
  'IO-540-M1C5': { tbo: 2000, overhaulCost: 48000 },
  'IO-540-M1D5': { tbo: 2000, overhaulCost: 48000 },
  'IO-540-W1A5': { tbo: 2000, overhaulCost: 48000 },
  'TIO-540-A2A': { tbo: 1800, overhaulCost: 75000 },
  'TIO-540-A2B': { tbo: 1800, overhaulCost: 75000 },
  'TIO-540-A2C': { tbo: 1800, overhaulCost: 75000 },
  'TIO-540-J2B': { tbo: 1800, overhaulCost: 75000 },
  // Continental
  'O-200-A': { tbo: 2400, overhaulCost: 22000 },
  'O-300-A': { tbo: 1800, overhaulCost: 25000 },
  'O-300-C': { tbo: 1800, overhaulCost: 25000 },
  'O-300-D': { tbo: 1800, overhaulCost: 25000 },
  'IO-360-A': { tbo: 1800, overhaulCost: 34000 },
  'IO-360-AB1A6': { tbo: 2000, overhaulCost: 36000 },
  'IO-360-C': { tbo: 1800, overhaulCost: 34000 },
  'IO-360-CB': { tbo: 1800, overhaulCost: 34000 },
  'IO-360-KB': { tbo: 1800, overhaulCost: 34000 },
  'IO-360-LB': { tbo: 1800, overhaulCost: 34000 },
  'IO-520-BA': { tbo: 1700, overhaulCost: 55000 },
  'IO-520-BB': { tbo: 1700, overhaulCost: 55000 },
  'IO-520-CB': { tbo: 1700, overhaulCost: 55000 },
  'IO-520-D': { tbo: 1700, overhaulCost: 55000 },
  'IO-520-E': { tbo: 1700, overhaulCost: 55000 },
  'IO-520-F': { tbo: 1700, overhaulCost: 55000 },
  'IO-520-M': { tbo: 1700, overhaulCost: 55000 },
  'IO-550-A': { tbo: 2000, overhaulCost: 65000 },
  'IO-550-B': { tbo: 1700, overhaulCost: 60000 },
  'IO-550-C': { tbo: 2000, overhaulCost: 65000 },
  'IO-550-D': { tbo: 2000, overhaulCost: 65000 },
  'IO-550-G': { tbo: 2000, overhaulCost: 65000 },
  'IO-550-N': { tbo: 2000, overhaulCost: 65000 },
  'TSIO-520-BE': { tbo: 1600, overhaulCost: 70000 },
  'TSIO-520-UB': { tbo: 1600, overhaulCost: 70000 },
  'TSIO-520-VB': { tbo: 1600, overhaulCost: 70000 },
  'TSIO-550-A': { tbo: 1800, overhaulCost: 80000 },
  'TSIO-550-B': { tbo: 1800, overhaulCost: 80000 },
  'TSIO-550-C': { tbo: 1800, overhaulCost: 80000 },
  'GTSIO-520-F': { tbo: 1600, overhaulCost: 75000 },
  'GTSIO-520-H': { tbo: 1600, overhaulCost: 75000 },
  // Rotax / other
  '912ULS': { tbo: 2000, overhaulCost: 18000 },
  '914UL': { tbo: 2000, overhaulCost: 22000 },
  '915IS': { tbo: 1200, overhaulCost: 35000 },
}

/** Longest-prefix wins (e.g. IO-520 → 1700) */
const PREFIX: Array<{ prefix: string; tbo: number; overhaulCost: number }> = [
  { prefix: 'TSIO-550', tbo: 1800, overhaulCost: 80000 },
  { prefix: 'TSIO-520', tbo: 1600, overhaulCost: 70000 },
  { prefix: 'GTSIO-520', tbo: 1600, overhaulCost: 75000 },
  { prefix: 'TIO-540', tbo: 1800, overhaulCost: 75000 },
  { prefix: 'IO-550', tbo: 2000, overhaulCost: 65000 },
  { prefix: 'IO-520', tbo: 1700, overhaulCost: 55000 },
  { prefix: 'IO-540', tbo: 2000, overhaulCost: 48000 },
  { prefix: 'IO-390', tbo: 2000, overhaulCost: 42000 },
  { prefix: 'IO-360', tbo: 2000, overhaulCost: 36000 },
  { prefix: 'IO-320', tbo: 2000, overhaulCost: 32000 },
  { prefix: 'O-540', tbo: 2000, overhaulCost: 42000 },
  { prefix: 'O-470', tbo: 2000, overhaulCost: 38000 },
  { prefix: 'O-360', tbo: 2000, overhaulCost: 32000 },
  { prefix: 'O-320', tbo: 2000, overhaulCost: 28000 },
  { prefix: 'O-300', tbo: 1800, overhaulCost: 25000 },
  { prefix: 'O-235', tbo: 2000, overhaulCost: 22000 },
  { prefix: 'O-200', tbo: 2400, overhaulCost: 22000 },
  { prefix: 'IO-360', tbo: 1800, overhaulCost: 34000 },
  { prefix: 'PT6A', tbo: 3600, overhaulCost: 250000 },
]

const DEFAULT: { tbo: number; overhaulCost: number } = { tbo: 2000, overhaulCost: 45000 }

export function normalizeEngineModel(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .replace(/^LYCOMING/, '')
    .replace(/^CONTINENTAL/, '')
    .replace(/^CONT/, '')
    .trim()
}

export function lookupEngineTbo(engineModel: string, _engineMake?: string): EngineSpec {
  const key = normalizeEngineModel(engineModel)
  if (!key) {
    return { ...DEFAULT, matchType: 'default', matchedKey: 'default' }
  }

  if (EXACT[key]) {
    const e = EXACT[key]
    return {
      tbo: e.tbo,
      overhaulCost: e.overhaulCost ?? DEFAULT.overhaulCost,
      matchType: 'exact',
      matchedKey: key,
    }
  }

  const sorted = [...PREFIX].sort((a, b) => b.prefix.length - a.prefix.length)
  for (const p of sorted) {
    if (key.startsWith(p.prefix)) {
      return { tbo: p.tbo, overhaulCost: p.overhaulCost, matchType: 'prefix', matchedKey: p.prefix }
    }
  }

  return { ...DEFAULT, matchType: 'default', matchedKey: 'default' }
}

export function engineLifeRemaining(smoh: number, tbo: number): {
  pctUsed: number
  pctRemaining: number
  hrsRemaining: number
  status: 'fresh' | 'mid' | 'high' | 'runout'
} {
  const used = Math.max(0, smoh)
  const limit = Math.max(1, tbo)
  const pctUsed = Math.min(100, Math.round((used / limit) * 100))
  const pctRemaining = Math.max(0, 100 - pctUsed)
  const hrsRemaining = Math.max(0, limit - used)
  let status: 'fresh' | 'mid' | 'high' | 'runout' = 'mid'
  if (pctRemaining >= 60) status = 'fresh'
  else if (pctRemaining >= 30) status = 'mid'
  else if (pctRemaining >= 10) status = 'high'
  else status = 'runout'
  return { pctUsed, pctRemaining, hrsRemaining, status }
}
