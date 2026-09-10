/**
 * Typical GA ownership costs (US, 2025–2026 ballpark) and public safety-data links.
 * Fuel assumed at $6.50/gal avgas. Figures are research ranges — not quotes.
 */

export type CostClass = 'trainer' | 'highperf' | 'twin' | 'experimental' | 'lsa' | 'vintage'

export interface CostProfile {
  id: string
  label: string
  class: CostClass
  match: RegExp
  gph: number
  insuranceAnnual: number
  maintenanceAnnual: number
  hangarAnnual: number
  engineReservePerHr: number
  note?: string
}

const FUEL_PER_GAL = 6.5
const HOURS_PER_YEAR = 100

export const COST_PROFILES: CostProfile[] = [
  {
    id: 'c172',
    label: 'Cessna 172',
    class: 'trainer',
    match: /172|skyhawk/i,
    gph: 8.5,
    insuranceAnnual: 1600,
    maintenanceAnnual: 2500,
    hangarAnnual: 4800,
    engineReservePerHr: 14,
  },
  {
    id: 'pa28',
    label: 'Piper PA-28 / Cherokee / Archer / Warrior',
    class: 'trainer',
    match: /pa-?28|cherokee|archer|warrior|dakota(?!\s*twin)|arrow/i,
    gph: 9,
    insuranceAnnual: 1700,
    maintenanceAnnual: 2600,
    hangarAnnual: 4800,
    engineReservePerHr: 15,
  },
  {
    id: 'sr20',
    label: 'Cirrus SR20',
    class: 'trainer',
    match: /sr20/i,
    gph: 11.5,
    insuranceAnnual: 3200,
    maintenanceAnnual: 4500,
    hangarAnnual: 5400,
    engineReservePerHr: 18,
    note: 'Insurance and CAPS parachute reserve run higher than a 172.',
  },
  {
    id: 'c182',
    label: 'Cessna 182 / Skylane',
    class: 'highperf',
    match: /182|skylane/i,
    gph: 13.5,
    insuranceAnnual: 2400,
    maintenanceAnnual: 3800,
    hangarAnnual: 5400,
    engineReservePerHr: 22,
  },
  {
    id: 'sr22',
    label: 'Cirrus SR22 / SR22T',
    class: 'highperf',
    match: /sr22/i,
    gph: 17.5,
    insuranceAnnual: 4800,
    maintenanceAnnual: 6500,
    hangarAnnual: 6000,
    engineReservePerHr: 28,
    note: 'Includes typical CAPS / higher hull insurance vs a 182.',
  },
  {
    id: 'a36',
    label: 'Beech Bonanza (F33 / A36 / V35)',
    class: 'highperf',
    match: /bonanza|f33|a36|v35|s35|n35|p35|k35/i,
    gph: 16,
    insuranceAnnual: 3200,
    maintenanceAnnual: 5500,
    hangarAnnual: 6000,
    engineReservePerHr: 28,
  },
  {
    id: 'mooney',
    label: 'Mooney M20',
    class: 'highperf',
    match: /mooney|m20[a-z]?/i,
    gph: 11.5,
    insuranceAnnual: 2600,
    maintenanceAnnual: 4200,
    hangarAnnual: 5400,
    engineReservePerHr: 22,
  },
  {
    id: 'rv10',
    label: "Van's RV-10",
    class: 'experimental',
    match: /rv-?10/i,
    gph: 11.5,
    insuranceAnnual: 2200,
    maintenanceAnnual: 2800,
    hangarAnnual: 4800,
    engineReservePerHr: 20,
    note: 'Owner-maintenance can lower shop bills; insurance varies with builder experience.',
  },
  {
    id: 'rv',
    label: "Van's RV (other)",
    class: 'experimental',
    match: /rv-?\d|van'?s/i,
    gph: 8.5,
    insuranceAnnual: 1800,
    maintenanceAnnual: 2200,
    hangarAnnual: 4200,
    engineReservePerHr: 16,
  },
  {
    id: 'baron',
    label: 'Beech Baron',
    class: 'twin',
    match: /baron/i,
    gph: 30,
    insuranceAnnual: 7200,
    maintenanceAnnual: 12000,
    hangarAnnual: 7200,
    engineReservePerHr: 55,
  },
  {
    id: 'seneca',
    label: 'Piper Seneca',
    class: 'twin',
    match: /seneca|pa-?34/i,
    gph: 24,
    insuranceAnnual: 6500,
    maintenanceAnnual: 10000,
    hangarAnnual: 6600,
    engineReservePerHr: 48,
  },
  {
    id: 'c310',
    label: 'Cessna 310 / 340',
    class: 'twin',
    match: /\b310\b|\b340\b|310r|340a/i,
    gph: 28,
    insuranceAnnual: 6800,
    maintenanceAnnual: 11000,
    hangarAnnual: 7000,
    engineReservePerHr: 52,
  },
  {
    id: 'lsa',
    label: 'Light-sport / SLSA',
    class: 'lsa',
    match: /sport\s*cruiser|skycatcher|ctsw|ctls|pipistrel|light.?sport|lsa/i,
    gph: 5,
    insuranceAnnual: 1400,
    maintenanceAnnual: 1800,
    hangarAnnual: 3600,
    engineReservePerHr: 12,
  },
  {
    id: 'vintage',
    label: 'Vintage / rag-and-tube',
    class: 'vintage',
    match: /195|140|170|champ|cub|staggerwing|waco|stearman|tailwheel/i,
    gph: 8,
    insuranceAnnual: 2000,
    maintenanceAnnual: 3200,
    hangarAnnual: 4800,
    engineReservePerHr: 16,
  },
  {
    id: 'generic',
    label: 'Typical piston single',
    class: 'trainer',
    match: /.*/,
    gph: 10,
    insuranceAnnual: 2000,
    maintenanceAnnual: 3000,
    hangarAnnual: 4800,
    engineReservePerHr: 18,
    note: 'Generic piston-single band — refine with your shop and insurer.',
  },
]

export interface CostTotals {
  fuelPerHr: number
  engineReservePerHr: number
  hourlyDirect: number
  insuranceAnnual: number
  maintenanceAnnual: number
  hangarAnnual: number
  annualFixed: number
  annualAt100Hrs: number
  hourlyAllIn: number
}

export function costTotals(p: CostProfile, fuelPerGal = FUEL_PER_GAL, hours = HOURS_PER_YEAR): CostTotals {
  const fuelPerHr = p.gph * fuelPerGal
  const hourlyDirect = fuelPerHr + p.engineReservePerHr
  const annualFixed = p.insuranceAnnual + p.maintenanceAnnual + p.hangarAnnual
  const annualAt100Hrs = annualFixed + hours * hourlyDirect
  return {
    fuelPerHr,
    engineReservePerHr: p.engineReservePerHr,
    hourlyDirect,
    insuranceAnnual: p.insuranceAnnual,
    maintenanceAnnual: p.maintenanceAnnual,
    hangarAnnual: p.hangarAnnual,
    annualFixed,
    annualAt100Hrs,
    hourlyAllIn: annualAt100Hrs / hours,
  }
}

export function lookupCostProfile(make: string, model: string): CostProfile {
  const blob = `${make} ${model}`.trim()
  for (const p of COST_PROFILES) {
    if (p.id === 'generic') continue
    if (p.match.test(blob) || p.match.test(model)) return p
  }
  return COST_PROFILES[COST_PROFILES.length - 1]
}

export interface PeerRow {
  id: string
  label: string
  isSubject: boolean
  hourlyAllIn: number
  annualAt100Hrs: number
}

export function peerComparison(subject: CostProfile, limit = 3): PeerRow[] {
  const peers = COST_PROFILES.filter(
    (p) => p.class === subject.class && p.id !== 'generic' && p.id !== subject.id,
  ).slice(0, limit)
  const rows = [subject, ...peers].map((p) => {
    const t = costTotals(p)
    return {
      id: p.id,
      label: p.id === subject.id ? subject.label : p.label,
      isSubject: p.id === subject.id,
      hourlyAllIn: t.hourlyAllIn,
      annualAt100Hrs: t.annualAt100Hrs,
    }
  })
  return rows
}

export interface SafetyLink {
  label: string
  href: string
  detail: string
}

export function normalizeNNumber(raw?: string | null): string | null {
  if (!raw) return null
  const t = String(raw).trim().toUpperCase().replace(/\s+/g, '')
  if (!t) return null
  const n = t.startsWith('N') ? t : `N${t}`
  if (!/^N[A-Z0-9]{1,6}$/.test(n)) return null
  return n
}

/** Public official / widely used safety databases — we link out, we do not scrape. */
export function safetyLinks(opts: {
  nnumber?: string | null
  make?: string
  model?: string
}): SafetyLink[] {
  const n = normalizeNNumber(opts.nnumber)
  const make = (opts.make || '').trim()
  const model = (opts.model || '').trim()
  const typeQ = encodeURIComponent([make, model].filter(Boolean).join(' ').trim())
  const links: SafetyLink[] = []

  if (n) {
    const reg = encodeURIComponent(n)
    links.push({
      label: `NTSB records for ${n}`,
      href: 'https://data.ntsb.gov/carol-main-public/basic-search',
      detail: `Search this tail number in the NTSB CAROL accident/incident database.`,
    })
    links.push({
      label: `Aviation Safety Network — ${n}`,
      href: `https://aviation-safety.net/wikibase/dblist.php?AcReg=${reg}`,
      detail: 'Occurrence list for this registration (if any events are on file).',
    })
  }

  if (typeQ) {
    links.push({
      label: `${make} ${model}`.trim() + ' — AOPA Air Safety Institute',
      href: 'https://www.aopa.org/training-and-safety/air-safety-institute/accident-analysis',
      detail: 'Type-level accident analysis and statistics (filter by make/model on their site).',
    })
    links.push({
      label: 'FAA ASIAS accident & incident data',
      href: 'https://www.asias.faa.gov/',
      detail: 'FAA Aviation Safety Information Analysis and Sharing — search this type or tail.',
    })
  } else {
    links.push({
      label: 'NTSB CAROL accident search',
      href: 'https://data.ntsb.gov/carol-main-public/basic-search',
      detail: 'Search NTSB aviation accident and incident records.',
    })
  }

  return links
}

export function ownershipContext(make: string, model: string, nnumber?: string | null) {
  const profile = lookupCostProfile(make, model)
  const totals = costTotals(profile)
  return {
    fuelPerGal: FUEL_PER_GAL,
    hoursPerYear: HOURS_PER_YEAR,
    profile: {
      id: profile.id,
      label: profile.label,
      class: profile.class,
      gph: profile.gph,
      note: profile.note || null,
    },
    totals,
    peers: peerComparison(profile),
    safety: safetyLinks({ nnumber, make, model }),
  }
}
