// Deterministic avionics value engine.
//
// Mirrors files/avionics_adjustments.xlsx. No AI guesses a price here — every
// figure traces to the coefficients below, which you control.
//
//   value_add = installedCost
//             * MAX( floorPct, retainedNew * (1 - annualDecay)^yearsSinceInstall )
//
// Three rules sit on top of the per-item table (see applyAvionicsRules):
//   1) ADS-B Out gate: penalty if no ADS-B Out source is present.
//   2) IFR capability bundle: +$2,500 if an LPV navigator AND a coupled AP both present.
//   3) Airframe cap: total positive avionics value capped at a % of base airframe value.

export interface AvionicsRow {
  /** Display name as surfaced to the user / matched from the form. */
  item: string
  category: string
  installedCost: number
  retainedNew: number
  annualDecay: number
  floorPct: number
  /** Default assumed age (years since install) when the listing gives no date. */
  yearsSinceInstall: number
  lpvWaas: boolean
  adsbOut: boolean
  adsbIn: boolean
  coupledAp: boolean
  glassPfd: boolean
  /** Form avionics display-name strings (from page.html avIds) that map to this row. */
  aliases: string[]
}

// Coefficients copied from the "Avionics Adjustments" sheet. Tune freely.
export const AVIONICS_ROWS: AvionicsRow[] = [
  // Navigators
  { item: 'Garmin GTN 750Xi', category: 'Navigator', installedCost: 26000, retainedNew: 0.6, annualDecay: 0.05, floorPct: 0.35, yearsSinceInstall: 3, lpvWaas: true, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['GTN 750Xi'] },
  { item: 'Garmin GTN 650Xi', category: 'Navigator', installedCost: 19000, retainedNew: 0.6, annualDecay: 0.05, floorPct: 0.35, yearsSinceInstall: 3, lpvWaas: true, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['GTN 650Xi'] },
  { item: 'Garmin GTN 750 (legacy)', category: 'Navigator', installedCost: 18000, retainedNew: 0.45, annualDecay: 0.06, floorPct: 0.25, yearsSinceInstall: 8, lpvWaas: true, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['GTN 750'] },
  { item: 'Garmin GTN 650 (legacy)', category: 'Navigator', installedCost: 13000, retainedNew: 0.45, annualDecay: 0.06, floorPct: 0.25, yearsSinceInstall: 8, lpvWaas: true, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['GTN 650'] },
  { item: 'Garmin GNS 530W', category: 'Navigator', installedCost: 11000, retainedNew: 0.4, annualDecay: 0.06, floorPct: 0.2, yearsSinceInstall: 15, lpvWaas: true, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['GNS 530W WAAS'] },
  { item: 'Garmin GNS 430W', category: 'Navigator', installedCost: 8000, retainedNew: 0.4, annualDecay: 0.06, floorPct: 0.2, yearsSinceInstall: 15, lpvWaas: true, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['GNS 430W WAAS'] },
  { item: 'Garmin GNX 375', category: 'Navigator', installedCost: 13000, retainedNew: 0.5, annualDecay: 0.06, floorPct: 0.3, yearsSinceInstall: 3, lpvWaas: true, adsbOut: true, adsbIn: true, coupledAp: false, glassPfd: false, aliases: ['Garmin GNX 375'] },
  { item: 'Garmin GPS 175', category: 'Navigator', installedCost: 9000, retainedNew: 0.48, annualDecay: 0.06, floorPct: 0.28, yearsSinceInstall: 3, lpvWaas: true, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['Garmin GPS 175'] },
  { item: 'Avidyne IFD540', category: 'Navigator', installedCost: 16000, retainedNew: 0.45, annualDecay: 0.06, floorPct: 0.25, yearsSinceInstall: 6, lpvWaas: true, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['Avidyne IFD 540/550'] },
  { item: 'Avidyne IFD440', category: 'Navigator', installedCost: 12000, retainedNew: 0.45, annualDecay: 0.06, floorPct: 0.25, yearsSinceInstall: 6, lpvWaas: true, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['Avidyne IFD 440'] },

  // Glass PFD/MFD
  { item: 'Garmin G500 TXi 10.6"', category: 'Glass', installedCost: 19000, retainedNew: 0.55, annualDecay: 0.06, floorPct: 0.3, yearsSinceInstall: 4, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: true, aliases: ['Garmin G500 TXi', 'Garmin G500 TXi 10.6"'] },
  { item: 'Garmin G500 TXi 7"', category: 'Glass', installedCost: 14000, retainedNew: 0.55, annualDecay: 0.06, floorPct: 0.3, yearsSinceInstall: 4, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: true, aliases: ['Garmin G500 TXi 7"'] },
  { item: 'Garmin G600 TXi 10.6"', category: 'Glass', installedCost: 26000, retainedNew: 0.55, annualDecay: 0.06, floorPct: 0.3, yearsSinceInstall: 4, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: true, aliases: ['Garmin G600 TXi', 'Garmin G600 TXi 10.6"'] },
  { item: 'Garmin G600 TXi 7"', category: 'Glass', installedCost: 18000, retainedNew: 0.55, annualDecay: 0.06, floorPct: 0.3, yearsSinceInstall: 4, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: true, aliases: ['Garmin G600 TXi 7"'] },
  { item: 'Garmin G3X Touch', category: 'Glass', installedCost: 22000, retainedNew: 0.55, annualDecay: 0.06, floorPct: 0.3, yearsSinceInstall: 3, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: true, aliases: ['Garmin G3X Touch'] },
  { item: 'Garmin GI 275 (each)', category: 'Glass', installedCost: 6000, retainedNew: 0.5, annualDecay: 0.06, floorPct: 0.3, yearsSinceInstall: 3, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: true, aliases: ['Garmin GI 275'] },
  { item: 'Garmin G5 (each)', category: 'Glass', installedCost: 5500, retainedNew: 0.5, annualDecay: 0.06, floorPct: 0.3, yearsSinceInstall: 4, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: true, aliases: ['Garmin G5'] },
  { item: 'Aspen Evolution E5', category: 'Glass', installedCost: 8000, retainedNew: 0.45, annualDecay: 0.07, floorPct: 0.25, yearsSinceInstall: 5, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: true, aliases: ['Aspen E5'] },
  { item: 'Aspen Evolution Pro Max', category: 'Glass', installedCost: 13000, retainedNew: 0.45, annualDecay: 0.07, floorPct: 0.25, yearsSinceInstall: 5, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: true, aliases: ['Aspen Pro 1000 MAX', 'Aspen 2500 MAX', 'Aspen MFD 500/1000'] },
  { item: 'Dynon SkyView HDX (STC)', category: 'Glass', installedCost: 16000, retainedNew: 0.45, annualDecay: 0.07, floorPct: 0.25, yearsSinceInstall: 4, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: true, aliases: ['Dynon SkyView HDX', 'Dynon SkyView SE'] },
  { item: 'Garmin G1000 NXi', category: 'Glass', installedCost: 90000, retainedNew: 0.4, annualDecay: 0.05, floorPct: 0.3, yearsSinceInstall: 5, lpvWaas: true, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: true, aliases: ['Garmin G1000 NXi'] },
  { item: 'Garmin G1000', category: 'Glass', installedCost: 70000, retainedNew: 0.35, annualDecay: 0.05, floorPct: 0.25, yearsSinceInstall: 12, lpvWaas: true, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: true, aliases: ['Garmin G1000'] },
  { item: 'Garmin G500', category: 'Glass', installedCost: 14000, retainedNew: 0.4, annualDecay: 0.06, floorPct: 0.22, yearsSinceInstall: 10, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: true, aliases: ['Garmin G500'] },
  { item: 'Avidyne Entegra R9', category: 'Glass', installedCost: 30000, retainedNew: 0.35, annualDecay: 0.06, floorPct: 0.2, yearsSinceInstall: 12, lpvWaas: true, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: true, aliases: ['Avidyne Entegra R9'] },

  // Autopilots
  { item: 'Garmin GFC 500 (2-axis)', category: 'Autopilot', installedCost: 18000, retainedNew: 0.6, annualDecay: 0.05, floorPct: 0.35, yearsSinceInstall: 4, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: true, glassPfd: false, aliases: ['Garmin GFC 500'] },
  { item: 'Garmin GFC 600', category: 'Autopilot', installedCost: 30000, retainedNew: 0.6, annualDecay: 0.05, floorPct: 0.35, yearsSinceInstall: 4, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: true, glassPfd: false, aliases: ['Garmin GFC 600'] },
  { item: 'Garmin GFC 700', category: 'Autopilot', installedCost: 35000, retainedNew: 0.55, annualDecay: 0.05, floorPct: 0.35, yearsSinceInstall: 8, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: true, glassPfd: false, aliases: ['Garmin GFC 700'] },
  { item: 'Genesys S-TEC 3100', category: 'Autopilot', installedCost: 20000, retainedNew: 0.58, annualDecay: 0.05, floorPct: 0.33, yearsSinceInstall: 4, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: true, glassPfd: false, aliases: ['S-TEC 3100'] },
  { item: 'Avidyne DFC100', category: 'Autopilot', installedCost: 15000, retainedNew: 0.5, annualDecay: 0.06, floorPct: 0.28, yearsSinceInstall: 7, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: true, glassPfd: false, aliases: ['Avidyne DFC 100'] },
  { item: 'Avidyne DFC90', category: 'Autopilot', installedCost: 10000, retainedNew: 0.45, annualDecay: 0.06, floorPct: 0.25, yearsSinceInstall: 9, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: true, glassPfd: false, aliases: ['Avidyne DFC 90'] },
  { item: 'Genesys S-TEC 55X', category: 'Autopilot', installedCost: 15000, retainedNew: 0.45, annualDecay: 0.06, floorPct: 0.25, yearsSinceInstall: 12, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: true, glassPfd: false, aliases: ['S-TEC 55X'] },
  { item: 'Genesys S-TEC (other legacy)', category: 'Autopilot', installedCost: 14000, retainedNew: 0.45, annualDecay: 0.06, floorPct: 0.25, yearsSinceInstall: 12, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: true, glassPfd: false, aliases: ['S-TEC 65', 'S-TEC 60', 'S-TEC 60-2', 'S-TEC 50', 'S-TEC 40', 'S-TEC 30', 'S-TEC other', 'S-TEC'] },
  { item: 'Bendix/King KFC 150/200', category: 'Autopilot', installedCost: 7000, retainedNew: 0.3, annualDecay: 0.05, floorPct: 0.15, yearsSinceInstall: 25, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: true, glassPfd: false, aliases: ['King KFC 150/200/225'] },

  // Transponder / ADS-B
  { item: 'Garmin GTX 345 (1090ES In/Out)', category: 'ADS-B', installedCost: 6500, retainedNew: 0.45, annualDecay: 0.07, floorPct: 0.2, yearsSinceInstall: 4, lpvWaas: false, adsbOut: true, adsbIn: true, coupledAp: false, glassPfd: false, aliases: ['GTX 345 ADS-B'] },
  { item: 'Garmin GDL 88 (978 In/Out)', category: 'ADS-B', installedCost: 4500, retainedNew: 0.35, annualDecay: 0.08, floorPct: 0.15, yearsSinceInstall: 8, lpvWaas: false, adsbOut: true, adsbIn: true, coupledAp: false, glassPfd: false, aliases: ['Garmin GDL 88'] },
  { item: 'ADS-B Out (generic)', category: 'ADS-B', installedCost: 5000, retainedNew: 0.42, annualDecay: 0.07, floorPct: 0.18, yearsSinceInstall: 4, lpvWaas: false, adsbOut: true, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['ADS-B Out'] },

  // Engine monitors
  { item: 'JPI EDM', category: 'Engine Monitor', installedCost: 5500, retainedNew: 0.5, annualDecay: 0.06, floorPct: 0.3, yearsSinceInstall: 4, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['JPI EDM'] },
  { item: 'EI CGR-30P', category: 'Engine Monitor', installedCost: 5000, retainedNew: 0.5, annualDecay: 0.06, floorPct: 0.3, yearsSinceInstall: 4, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['EI CGR-30P'] },
  { item: 'EI monitor', category: 'Engine Monitor', installedCost: 3500, retainedNew: 0.45, annualDecay: 0.07, floorPct: 0.25, yearsSinceInstall: 5, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['EI monitor'] },

  // Audio panels
  { item: 'Garmin GMA 345 (Bluetooth)', category: 'Audio Panel', installedCost: 3500, retainedNew: 0.4, annualDecay: 0.07, floorPct: 0.2, yearsSinceInstall: 4, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['GMA 345 audio'] },
  { item: 'Garmin GMA 350/35c', category: 'Audio Panel', installedCost: 3000, retainedNew: 0.4, annualDecay: 0.07, floorPct: 0.2, yearsSinceInstall: 6, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['Garmin GMA 350'] },
  { item: 'PS Engineering PMA 8000', category: 'Audio Panel', installedCost: 2500, retainedNew: 0.35, annualDecay: 0.07, floorPct: 0.18, yearsSinceInstall: 8, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['PS Engineering PMA 8000'] },
  { item: 'PS Engineering PMA 450B', category: 'Audio Panel', installedCost: 3200, retainedNew: 0.4, annualDecay: 0.07, floorPct: 0.2, yearsSinceInstall: 4, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['PS Engineering PMA 450B'] },
  { item: 'PS Engineering PMA 6000/7000', category: 'Audio Panel', installedCost: 1800, retainedNew: 0.3, annualDecay: 0.07, floorPct: 0.15, yearsSinceInstall: 12, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['PS Engineering PMA 6000/7000'] },

  // Standby instruments
  { item: 'L3 ESI-500 electronic standby', category: 'Standby Instrument', installedCost: 9000, retainedNew: 0.45, annualDecay: 0.06, floorPct: 0.25, yearsSinceInstall: 5, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['L3 ESI-500'] },
  { item: 'Garmin GI 275 standby', category: 'Standby Instrument', installedCost: 6000, retainedNew: 0.5, annualDecay: 0.06, floorPct: 0.3, yearsSinceInstall: 3, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['Garmin GI 275 standby'] },

  // Integration / adapters
  { item: 'Garmin GAD 43e autopilot adapter', category: 'Integration', installedCost: 2500, retainedNew: 0.4, annualDecay: 0.06, floorPct: 0.2, yearsSinceInstall: 5, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['Garmin GAD 43e'] },

  // uAvionix (mostly experimental)
  { item: 'uAvionix skyBeacon', category: 'ADS-B', installedCost: 2000, retainedNew: 0.45, annualDecay: 0.07, floorPct: 0.25, yearsSinceInstall: 4, lpvWaas: false, adsbOut: true, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['skyBeacon'] },
  { item: 'uAvionix tailBeacon', category: 'ADS-B', installedCost: 2000, retainedNew: 0.45, annualDecay: 0.07, floorPct: 0.25, yearsSinceInstall: 4, lpvWaas: false, adsbOut: true, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['tailBeacon'] },
  { item: 'uAvionix echoUAT', category: 'ADS-B', installedCost: 1500, retainedNew: 0.4, annualDecay: 0.07, floorPct: 0.2, yearsSinceInstall: 5, lpvWaas: false, adsbOut: true, adsbIn: true, coupledAp: false, glassPfd: false, aliases: ['echoUAT'] },
  { item: 'uAvionix tailBeaconX', category: 'ADS-B', installedCost: 2500, retainedNew: 0.5, annualDecay: 0.06, floorPct: 0.25, yearsSinceInstall: 2, lpvWaas: false, adsbOut: true, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['tailBeaconX'] },
  { item: 'uAvionix AV-30', category: 'Glass', installedCost: 2200, retainedNew: 0.5, annualDecay: 0.06, floorPct: 0.25, yearsSinceInstall: 3, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: true, aliases: ['uAvionix AV-30', 'AV-30-C', 'AV-30-E'] },
  { item: 'uAvionix AvLink', category: 'Integration', installedCost: 250, retainedNew: 0.4, annualDecay: 0.08, floorPct: 0.2, yearsSinceInstall: 3, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['AvLink'] },
  { item: 'uAvionix BeaconX', category: 'ADS-B', installedCost: 2500, retainedNew: 0.5, annualDecay: 0.06, floorPct: 0.25, yearsSinceInstall: 2, lpvWaas: false, adsbOut: true, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['uAvionix BeaconX', 'BeaconX'] },

  // Traffic
  { item: 'Active traffic (TAS/Skywatch)', category: 'Traffic', installedCost: 10000, retainedNew: 0.35, annualDecay: 0.08, floorPct: 0.15, yearsSinceInstall: 8, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['Traffic TAS'] },

  // Comfort & environment
  { item: 'Air conditioning', category: 'Comfort', installedCost: 20000, retainedNew: 0.55, annualDecay: 0.04, floorPct: 0.35, yearsSinceInstall: 10, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['Air conditioning'] },

  // Safety & awareness (do not double-count SVT bundled in G1000 NXi / Perspective+)
  { item: 'Angle of attack (AOA)', category: 'Safety', installedCost: 4000, retainedNew: 0.5, annualDecay: 0.06, floorPct: 0.3, yearsSinceInstall: 5, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['Angle of attack (AOA)'] },
  { item: 'FIKI / TKS known ice', category: 'Safety', installedCost: 28000, retainedNew: 0.55, annualDecay: 0.04, floorPct: 0.35, yearsSinceInstall: 8, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['FIKI / TKS known ice'] },
  { item: 'TAWS (terrain awareness)', category: 'Safety', installedCost: 11000, retainedNew: 0.42, annualDecay: 0.06, floorPct: 0.25, yearsSinceInstall: 8, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['TAWS (terrain awareness)'] },
  { item: 'Synthetic vision (add-on)', category: 'Safety', installedCost: 5500, retainedNew: 0.48, annualDecay: 0.06, floorPct: 0.3, yearsSinceInstall: 4, lpvWaas: false, adsbOut: false, adsbIn: false, coupledAp: false, glassPfd: false, aliases: ['Synthetic vision'] },
]

const ADSB_NONCOMPLIANT_PENALTY = -7000
const IFR_BUNDLE_BONUS = 2500
const DEFAULT_AIRFRAME_CAP_PCT = 0.4

export interface AvionicsLineItem {
  item: string
  category: string
  qty: number
  valueAdd: number
}

export interface AvionicsResult {
  lineItems: AvionicsLineItem[]
  sumAdds: number
  ifrBundleBonus: number
  adsbPenalty: number
  rawValue: number
  cap: number | null
  appliedValue: number
  hasAdsbOut: boolean
  hasLpvNav: boolean
  hasCoupledAp: boolean
  /** Human-readable summary suitable for injecting into the LLM prompt. */
  summary: string
}

/** Per-item retained-value decay → current dollar add. */
export function itemValueAdd(row: AvionicsRow): number {
  const retained = Math.max(
    row.floorPct,
    row.retainedNew * Math.pow(1 - row.annualDecay, row.yearsSinceInstall),
  )
  return Math.round(row.installedCost * retained)
}

/** Find the adjustment row matching a form avionics display-name string. */
function findRow(name: string): AvionicsRow | undefined {
  const n = name.trim().toLowerCase()
  return AVIONICS_ROWS.find((r) =>
    r.item.toLowerCase() === n || r.aliases.some((a) => a.toLowerCase() === n),
  )
}

/**
 * Compute the deterministic avionics value adjustment from the list of selected
 * avionics display-name strings (as produced by the valuation form).
 *
 * @param selected  Avionics display names (e.g. ["GTN 750Xi", "Garmin GFC 500"]).
 * @param baseAirframeValue  Optional base airframe value to apply the airframe cap.
 */
export function computeAvionicsAdjustment(
  selected: string[],
  baseAirframeValue?: number,
): AvionicsResult {
  const counts = new Map<string, number>()
  for (const s of selected) {
    const row = findRow(s)
    if (!row) continue
    counts.set(row.item, (counts.get(row.item) || 0) + 1)
  }

  const lineItems: AvionicsLineItem[] = []
  let sumAdds = 0
  let hasAdsbOut = false
  let hasLpvNav = false
  let hasCoupledAp = false

  for (const [item, qty] of counts) {
    const row = AVIONICS_ROWS.find((r) => r.item === item)!
    const each = itemValueAdd(row)
    const valueAdd = each * qty
    sumAdds += valueAdd
    if (row.adsbOut) hasAdsbOut = true
    if (row.lpvWaas) hasLpvNav = true
    if (row.coupledAp) hasCoupledAp = true
    lineItems.push({ item: row.item, category: row.category, qty, valueAdd })
  }

  // Rule 1: ADS-B Out gate — penalty if no ADS-B Out source present.
  const adsbPenalty = hasAdsbOut ? 0 : ADSB_NONCOMPLIANT_PENALTY
  // Rule 2: IFR capability bundle — LPV navigator + coupled AP.
  const ifrBundleBonus = hasLpvNav && hasCoupledAp ? IFR_BUNDLE_BONUS : 0

  const rawValue = sumAdds + ifrBundleBonus + adsbPenalty

  // Rule 3: airframe cap — cap positive avionics value at a % of base airframe.
  let cap: number | null = null
  let appliedValue = rawValue
  if (baseAirframeValue && baseAirframeValue > 0) {
    cap = Math.round(baseAirframeValue * DEFAULT_AIRFRAME_CAP_PCT)
    // Only cap the positive portion; a penalty should still apply in full.
    const positive = Math.max(0, sumAdds + ifrBundleBonus)
    const cappedPositive = Math.min(positive, cap)
    appliedValue = cappedPositive + adsbPenalty
  }

  const fmt = (n: number) => (n < 0 ? '-$' : '+$') + Math.abs(n).toLocaleString('en-US')
  const lines = lineItems
    .map((li) => `- ${li.item}${li.qty > 1 ? ` x${li.qty}` : ''}: ${fmt(li.valueAdd)}`)
    .join('\n')
  const ruleLines: string[] = []
  if (ifrBundleBonus) ruleLines.push(`- IFR capability bundle (LPV nav + coupled AP): ${fmt(ifrBundleBonus)}`)
  if (adsbPenalty) ruleLines.push(`- ADS-B Out NON-COMPLIANT penalty: ${fmt(adsbPenalty)}`)
  if (cap !== null && rawValue > cap) ruleLines.push(`- Airframe cap applied (40% of base = ${fmt(cap)})`)

  const summary =
    'DETERMINISTIC AVIONICS VALUE (use these exact figures; do not re-estimate avionics):\n' +
    (lines || '- (no recognized avionics with table coefficients)') +
    (ruleLines.length ? '\n' + ruleLines.join('\n') : '') +
    `\nTotal avionics adjustment to apply: ${fmt(appliedValue)}\n`

  return {
    lineItems,
    sumAdds,
    ifrBundleBonus,
    adsbPenalty,
    rawValue,
    cap,
    appliedValue,
    hasAdsbOut,
    hasLpvNav,
    hasCoupledAp,
    summary,
  }
}
