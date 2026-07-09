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
  // IO-550 — TCM recommended TBO (hours; calendar limits not modeled here)
  'IO-550-A': { tbo: 1900, overhaulCost: 62000 },
  'IO-550-B': { tbo: 1700, overhaulCost: 60000 },
  'IO-550-C': { tbo: 2000, overhaulCost: 62000 },
  'IO-550-D': { tbo: 2000, overhaulCost: 62000 },
  'IO-550-F': { tbo: 2200, overhaulCost: 65000 },
  'IO-550-G': { tbo: 2200, overhaulCost: 65000 },
  'IO-550-L': { tbo: 2200, overhaulCost: 65000 },
  'IO-550-N': { tbo: 2200, overhaulCost: 65000 },
  'IO-550-P': { tbo: 2200, overhaulCost: 65000 },
  'IO-550-R': { tbo: 2200, overhaulCost: 65000 },
  'TSIO-520-BE': { tbo: 1600, overhaulCost: 70000 },
  'TSIO-520-UB': { tbo: 1600, overhaulCost: 70000 },
  'TSIO-520-VB': { tbo: 1600, overhaulCost: 70000 },
  'TSIO-550-A': { tbo: 1800, overhaulCost: 80000 },
  'TSIO-550-B': { tbo: 1800, overhaulCost: 80000 },
  'TSIO-550-C': { tbo: 1800, overhaulCost: 80000 },
  'TSIO-550-K': { tbo: 1800, overhaulCost: 80000 },
  'GTSIO-520-F': { tbo: 1600, overhaulCost: 75000 },
  'GTSIO-520-H': { tbo: 1600, overhaulCost: 75000 },
  // Rotax
  '912ULS': { tbo: 2000, overhaulCost: 18000 },
  '912UL': { tbo: 2000, overhaulCost: 18000 },
  '912S': { tbo: 2000, overhaulCost: 18000 },
  '912IS': { tbo: 2000, overhaulCost: 20000 },
  '914UL': { tbo: 2000, overhaulCost: 22000 },
  '914F': { tbo: 2000, overhaulCost: 24000 },
  '915IS': { tbo: 1200, overhaulCost: 35000 },
  '916IS': { tbo: 1200, overhaulCost: 40000 },
  // Lycoming turbo / aerobatic
  'TIO-360-A1B': { tbo: 1800, overhaulCost: 55000 },
  'TIO-360-A3B6': { tbo: 1800, overhaulCost: 55000 },
  'TIO-541-A1A': { tbo: 1800, overhaulCost: 85000 },
  'TIO-541-E1A4': { tbo: 1800, overhaulCost: 90000 },
  'AEIO-540-D4D5': { tbo: 2000, overhaulCost: 52000 },
  'AEIO-580-B1A': { tbo: 2000, overhaulCost: 58000 },
  // Continental turbo twins (Baron, Duke, etc.)
  'TSIO-360-EB': { tbo: 1800, overhaulCost: 55000 },
  'TSIO-360-GB': { tbo: 1800, overhaulCost: 55000 },
  'TSIO-360-HB': { tbo: 1800, overhaulCost: 55000 },
  'TSIO-360-KB': { tbo: 1800, overhaulCost: 55000 },
  'TSIO-360-LB': { tbo: 1800, overhaulCost: 55000 },
  'TSIO-360-MB': { tbo: 1800, overhaulCost: 55000 },
  'TSIO-360-UB': { tbo: 1800, overhaulCost: 55000 },
  'TIO-520-AE': { tbo: 1600, overhaulCost: 68000 },
  'TIO-520-JF': { tbo: 1600, overhaulCost: 68000 },
  'TIO-520-LB': { tbo: 1600, overhaulCost: 68000 },
  'TIO-520-NB': { tbo: 1600, overhaulCost: 68000 },
  // PT6 turboprops
  'PT6A-6': { tbo: 3500, overhaulCost: 180000 },
  'PT6A-11': { tbo: 3500, overhaulCost: 200000 },
  'PT6A-20': { tbo: 3500, overhaulCost: 220000 },
  'PT6A-21': { tbo: 3600, overhaulCost: 230000 },
  'PT6A-27': { tbo: 3600, overhaulCost: 240000 },
  'PT6A-28': { tbo: 3600, overhaulCost: 240000 },
  'PT6A-34': { tbo: 3600, overhaulCost: 250000 },
  'PT6A-35': { tbo: 3600, overhaulCost: 250000 },
  'PT6A-41': { tbo: 3600, overhaulCost: 260000 },
  'PT6A-42': { tbo: 3600, overhaulCost: 260000 },
  'PT6A-60A': { tbo: 3600, overhaulCost: 280000 },
  'PT6A-64': { tbo: 5000, overhaulCost: 320000 },
  'PT6A-65B': { tbo: 3600, overhaulCost: 290000 },
  'PT6A-67A': { tbo: 3600, overhaulCost: 300000 },
  'PT6A-67B': { tbo: 3600, overhaulCost: 300000 },
  'PT6A-67P': { tbo: 3600, overhaulCost: 310000 },
  // Garrett / Honeywell (King Air, etc.)
  'TPE331-1': { tbo: 3600, overhaulCost: 200000 },
  'TPE331-3': { tbo: 3600, overhaulCost: 220000 },
  'TPE331-5': { tbo: 3600, overhaulCost: 240000 },
  'TPE331-6': { tbo: 3600, overhaulCost: 250000 },
  'TPE331-10': { tbo: 3600, overhaulCost: 260000 },
  'TPE331-11': { tbo: 3600, overhaulCost: 270000 },
}

/** Longest-prefix wins (e.g. IO-520 → 1700) */
const PREFIX: Array<{ prefix: string; tbo: number; overhaulCost: number }> = [
  { prefix: 'PT6A-67', tbo: 3600, overhaulCost: 300000 },
  { prefix: 'PT6A-65', tbo: 3600, overhaulCost: 290000 },
  { prefix: 'PT6A-64', tbo: 5000, overhaulCost: 320000 },
  { prefix: 'PT6A-60', tbo: 3600, overhaulCost: 280000 },
  { prefix: 'PT6A-42', tbo: 3600, overhaulCost: 260000 },
  { prefix: 'PT6A-41', tbo: 3600, overhaulCost: 260000 },
  { prefix: 'PT6A-35', tbo: 3600, overhaulCost: 250000 },
  { prefix: 'PT6A-34', tbo: 3600, overhaulCost: 250000 },
  { prefix: 'PT6A-28', tbo: 3600, overhaulCost: 240000 },
  { prefix: 'PT6A-27', tbo: 3600, overhaulCost: 240000 },
  { prefix: 'PT6A-21', tbo: 3600, overhaulCost: 230000 },
  { prefix: 'PT6A-20', tbo: 3500, overhaulCost: 220000 },
  { prefix: 'PT6A-11', tbo: 3500, overhaulCost: 200000 },
  { prefix: 'PT6A', tbo: 3600, overhaulCost: 250000 },
  { prefix: 'TPE331', tbo: 3600, overhaulCost: 250000 },
  { prefix: 'TIO-541', tbo: 1800, overhaulCost: 88000 },
  { prefix: 'TIO-520', tbo: 1600, overhaulCost: 68000 },
  { prefix: 'TSIO-550', tbo: 1800, overhaulCost: 80000 },
  { prefix: 'TSIO-520', tbo: 1600, overhaulCost: 70000 },
  { prefix: 'TSIO-360', tbo: 1800, overhaulCost: 55000 },
  { prefix: 'GTSIO-520', tbo: 1600, overhaulCost: 75000 },
  { prefix: 'TIO-540', tbo: 1800, overhaulCost: 75000 },
  { prefix: 'TIO-360', tbo: 1800, overhaulCost: 55000 },
  { prefix: 'AEIO-580', tbo: 2000, overhaulCost: 58000 },
  { prefix: 'AEIO-540', tbo: 2000, overhaulCost: 52000 },
  { prefix: '916IS', tbo: 1200, overhaulCost: 40000 },
  { prefix: '915IS', tbo: 1200, overhaulCost: 35000 },
  { prefix: '914', tbo: 2000, overhaulCost: 22000 },
  { prefix: '912', tbo: 2000, overhaulCost: 18000 },
  { prefix: 'IO-550-G', tbo: 2200, overhaulCost: 65000 },
  { prefix: 'IO-550-F', tbo: 2200, overhaulCost: 65000 },
  { prefix: 'IO-550-L', tbo: 2200, overhaulCost: 65000 },
  { prefix: 'IO-550-N', tbo: 2200, overhaulCost: 65000 },
  { prefix: 'IO-550-P', tbo: 2200, overhaulCost: 65000 },
  { prefix: 'IO-550-R', tbo: 2200, overhaulCost: 65000 },
  { prefix: 'IO-550-A', tbo: 1900, overhaulCost: 62000 },
  { prefix: 'IO-550-B', tbo: 1700, overhaulCost: 60000 },
  { prefix: 'IO-550', tbo: 2000, overhaulCost: 62000 },
  { prefix: 'IO550', tbo: 2000, overhaulCost: 62000 },
  { prefix: 'IO-520', tbo: 1700, overhaulCost: 55000 },
  { prefix: 'IO520', tbo: 1700, overhaulCost: 55000 },
  { prefix: 'IO-540', tbo: 2000, overhaulCost: 48000 },
  { prefix: 'IO-470', tbo: 2000, overhaulCost: 40000 },
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
]

const DEFAULT: { tbo: number; overhaulCost: number } = { tbo: 2000, overhaulCost: 45000 }

export function normalizeEngineModel(raw: string): string {
  let s = raw
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .replace(/^LYCOMING/, '')
    .replace(/^CONTINENTAL/, '')
    .replace(/^CONT/, '')
    .trim()
  // IO520BB / IO550N → IO-520-BB / IO-550-N
  s = s.replace(/^IO-?(\d{3})-?([A-Z].*)$/, 'IO-$1-$2')
  return s
}

const IO_520_FAMILY = /^IO-520/

function isContinentalMake(make?: string): boolean {
  const m = (make || '').toUpperCase()
  return /CONTINENTAL|CONT\.?/.test(m) || m === 'TCM'
}

export function lookupEngineTbo(
  engineModel: string,
  engineMake?: string,
  options?: { tboOverride?: number },
): EngineSpec {
  const key = normalizeEngineModel(engineModel)
  let spec: EngineSpec

  if (!key) {
    spec = { ...DEFAULT, matchType: 'default', matchedKey: 'default' }
  } else if (EXACT[key]) {
    const e = EXACT[key]
    spec = {
      tbo: e.tbo,
      overhaulCost: e.overhaulCost ?? DEFAULT.overhaulCost,
      matchType: 'exact',
      matchedKey: key,
    }
  } else {
    const sorted = [...PREFIX].sort((a, b) => b.prefix.length - a.prefix.length)
    const match = sorted.find((p) => key.startsWith(p.prefix))
    spec = match
      ? { tbo: match.tbo, overhaulCost: match.overhaulCost, matchType: 'prefix', matchedKey: match.prefix }
      : { ...DEFAULT, matchType: 'default', matchedKey: 'default' }
  }

  // IO-520 big-bore Continental — 1700 hrs when no exact/prefix match
  if (
    spec.matchType === 'default' &&
    (IO_520_FAMILY.test(key) || (isContinentalMake(engineMake) && /IO-?520/i.test(engineModel)))
  ) {
    spec = { tbo: 1700, overhaulCost: 55000, matchType: 'family', matchedKey: 'IO-520' }
  }

  const override = options?.tboOverride
  if (override != null && override > 0 && override !== spec.tbo) {
    return { ...spec, tbo: Math.round(override), matchedKey: spec.matchedKey + ' (TBO override)' }
  }
  return spec
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
