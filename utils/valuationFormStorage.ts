import { ALL_AVIONICS_ITEMS } from '~/data/avionicsCatalog'

export const VALUATION_FORM_STORAGE_KEY = 'spv_valuation_form'

export type ValuationFormSnapshot = {
  paste: string
  make: string
  model: string
  year: string
  annualMonth: string
  annualYear: string
  outOfAnnual: boolean
  engineDisplay: string
  asking: string
  ttaf: string
  engines: string
  cirrusGen: string
  cirrusTouched: boolean
  tbo: string
  engConv: string
  smoh: string
  prop1: string
  smohL: string
  smohR: string
  propL: string
  propR: string
  cond: string
  cosm: string
  logbooks: string
  damage: string
  avionicsPackage: string
  notes: string
  avChecked: Record<string, boolean>
  avQty: Record<string, string>
  avSize: Record<string, string>
  tboUserOverride: boolean
  extraTbo: string | null
  engineTboAuto: number
  valEngMake: string
  valEngModel: string
}

export function emptyAvChecked() {
  return Object.fromEntries(ALL_AVIONICS_ITEMS.map((i) => [i.id, false])) as Record<string, boolean>
}

export function emptyAvQty() {
  return Object.fromEntries(
    ALL_AVIONICS_ITEMS.filter((i) => i.qtyOptions).map((i) => [i.id, '1']),
  ) as Record<string, string>
}

export function emptyAvSize() {
  return Object.fromEntries(
    ALL_AVIONICS_ITEMS.filter((i) => i.sizeOptions).map((i) => [i.id, i.sizeOptions![0].value]),
  ) as Record<string, string>
}

export function emptyValuationForm(): ValuationFormSnapshot {
  return {
    paste: '',
    make: '',
    model: '',
    year: '',
    annualMonth: '',
    annualYear: '',
    outOfAnnual: false,
    engineDisplay: '',
    asking: '',
    ttaf: '',
    engines: '1',
    cirrusGen: '',
    cirrusTouched: false,
    tbo: '2000',
    engConv: '',
    smoh: '',
    prop1: '',
    smohL: '',
    smohR: '',
    propL: '',
    propR: '',
    cond: 'Good — minor wear',
    cosm: 'Good condition',
    logbooks: '',
    damage: '',
    avionicsPackage: '',
    notes: '',
    avChecked: emptyAvChecked(),
    avQty: emptyAvQty(),
    avSize: emptyAvSize(),
    tboUserOverride: false,
    extraTbo: null,
    engineTboAuto: 2000,
    valEngMake: '',
    valEngModel: '',
  }
}

export function mergeValuationForm(raw: unknown): ValuationFormSnapshot {
  const base = emptyValuationForm()
  if (!raw || typeof raw !== 'object') return base
  const v = raw as Partial<ValuationFormSnapshot>
  return {
    ...base,
    ...v,
    avChecked: { ...base.avChecked, ...(v.avChecked || {}) },
    avQty: { ...base.avQty, ...(v.avQty || {}) },
    avSize: { ...base.avSize, ...(v.avSize || {}) },
    extraTbo: v.extraTbo ?? null,
    outOfAnnual: !!v.outOfAnnual,
    cirrusTouched: !!v.cirrusTouched,
    tboUserOverride: !!v.tboUserOverride,
    engineTboAuto: typeof v.engineTboAuto === 'number' ? v.engineTboAuto : base.engineTboAuto,
  }
}
