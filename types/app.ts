export type TabId = 'lookup' | 'val' | 'comps' | 'checklist' | 'sold' | 'feedback'

export interface LookupOwner {
  name: string
  city: string
  state: string
  from: string
  to: string | null
  current: boolean
}

export interface LookupFlag {
  type: 'danger' | 'warn' | 'info'
  title: string
  detail: string
}

export interface LookupRecord {
  found: boolean
  nnumber: string
  status?: string
  statusCode?: string
  make?: string
  model?: string
  year?: string | number
  serialNumber?: string
  aircraftType?: string
  engineMake?: string
  engineModel?: string
  seats?: string | number
  numEngines?: string | number
  certDate?: string
  airworthinessCert?: string
  registrationExpiry?: string
  registrantName?: string
  city?: string
  state?: string
  adNotes?: string
  error?: string
  ownerHistory?: LookupOwner[]
  flags?: LookupFlag[]
}

export interface ValuationResult {
  sellerAsk?: number
  askHigh?: number
  fairMarketValue?: number
  askMid?: number
  buyerTarget?: number
  askLow?: number
  condImpact?: string
  avImpact?: string
  engineImpact?: string
  condVerdict?: string
  avVerdict?: string
  engineVerdict?: string
  keyFinding?: string
  analysis?: string
  negotiatingTips?: string[]
  confidence?: string
}

export interface EngineLifeBlock {
  label: string
  smoh: number
  tbo: number
  life?: {
    pctRemaining?: number
    pctUsed?: number
    hrsRemaining?: number
    status?: string
  } | null
}

export interface EngineLifeState {
  tbo: number
  engines: EngineLifeBlock[]
  model: string
}

export interface EngineTboSpec {
  tbo: number
  matchType?: string
  matchedKey?: string
}

export interface CompsListing {
  year: number
  ttaf?: number
  smoh?: number
  cond?: string
  ask?: number
  daysListed: number
}

export interface CompsResult {
  summary?: string
  askLow?: number
  askMid?: number
  askHigh?: number
  avgDaysListed?: number
  negotiationNote?: string
  listings?: CompsListing[]
}

export interface ChecklistItem {
  id: number
  si: number
  name: string
  note: string
  critical?: boolean
  criticalReason?: string
  status: 'open' | 'pass' | 'flag' | 'fail'
}

export interface ChecklistSection {
  name: string
  items: Array<{
    name: string
    note: string
    critical?: boolean
    criticalReason?: string
  }>
}

export interface SoldEntry {
  id: number
  make: string
  model: string
  year: number
  price: number
  ask: number | null
  ttaf: number | null
  smoh: number | null
  saleDate: string | null
  region: string | null
  avionics: string | null
  notes: string | null
  role: string
  dom: string | null
  ts: string
}

export interface FeedbackEntry {
  email: string
  aircraft: string
  accuracy: string
  message: string
  ts: string
}

export interface ParsedListing {
  make?: string | null
  model?: string | null
  year?: number | null
  ttaf?: number | null
  engines?: number | null
  smoh?: number | null
  smohR?: number | null
  propHrs?: number | null
  propHrsR?: number | null
  condition?: string | null
  cosmetics?: string | null
  avionics?: string[] | null
  notes?: string | null
}

export interface ValuationRequest {
  make: string
  model: string
  year: string
  ttaf: string
  engineInfo: string
  annualInfo: string
  cond: string
  cosm: string
  avionics: string[]
  notes: string
  asking: string
  cirrusGen: string
  logbooks: string
  damage: string
  outOfAnnual: boolean
  avionicsPackage: string
  clientId: string
  email: string | null
  engineModel: string
  engineTbo: number
  engineSmoh: number | null
  engineSmohL: number | null
  engineSmohR: number | null
  isTwin: boolean
  engineConversion: string
}

export interface ParsedSale {
  make?: string | null
  model?: string | null
  year?: number | null
  salePrice?: number | null
  askingPrice?: number | null
  ttaf?: number | null
  smoh?: number | null
  saleMonth?: string | null
  region?: string | null
  avionicsTier?: string | null
  daysOnMarket?: string | null
  avionics?: string[] | null
  notes?: string | null
}
