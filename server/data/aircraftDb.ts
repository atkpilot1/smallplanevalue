/**
 * SmallPlaneValue — internal aircraft listing database (server/data/aircraftDb.ts)
 * --------------------------------------------------------------------------
 * Loads the scraped Trade-A-Plane catalog (aircraft-db.json), validates and
 * normalizes it into typed `Comparable` records, and exposes a fuzzy search
 * (fuse.js) over make/model so the valuation LLM can be grounded in real,
 * structured comps in addition to live web search.
 *
 * Design notes:
 *  - Listings WITHOUT a usable asking price are dropped — a comp with no price
 *    is useless for valuation.
 *  - The raw `price` field in the source JSON is unreliable (frequently doubled,
 *    e.g. 195000195000), so the asking price is parsed from `priceText` first
 *    and only falls back to a sanitized `price`.
 *  - Year is NOT used to filter — nearby years of the same make/model are
 *    valuable comps. Year is only carried through as data on each comp.
 * --------------------------------------------------------------------------
 */
import Fuse from 'fuse.js'
import type { ForSaleCount } from '../../types/app'
import rawDb from './aircraft-db.json'

/** A normalized, price-bearing comparable listing ready for the LLM. */
export interface Comparable {
  listingId: string
  category: string | null
  modelGroup: string | null
  makeModel: string | null
  title: string | null
  year: number | null
  /** Parsed asking price in USD (always present for a Comparable). */
  askingPrice: number
  registration: string | null
  serialNumber: string | null
  totalTime: string | null
  saleStatus: string | null
  location: string | null
  seller: string | null
  description: string | null
  /** Flattened detail sections (detailed_desc, airframe, engines_mods, avionics_equipment, …). */
  details: Record<string, string>
  url: string | null
  /** Combined searchable text used to build the fuzzy index. */
  searchText: string
}

interface RawSection {
  heading?: string
  content?: string
}

interface RawListing {
  listingId?: string
  category?: string | null
  modelGroup?: string | null
  makeModel?: string | null
  title?: string | null
  year?: number | null
  price?: number | null
  priceText?: string | null
  registration?: string | null
  serialNumber?: string | null
  totalTime?: string | null
  saleStatus?: string | null
  location?: string | null
  seller?: string | null
  description?: string | null
  sections?: Record<string, RawSection> | null
  url?: string | null
}

interface RawDbMeta {
  lastCatalogSyncCompletedAt?: string | null
}

interface RawDb {
  meta?: RawDbMeta
  listings?: Record<string, RawListing>
}

/**
 * Parse a usable asking price (USD) from a listing.
 * Returns null for "Call for Price" / unparseable / non-positive values.
 *
 * `priceText` examples seen in the data:
 *   "169,000"
 *   "195000Price: $195,000 USD"   (doubled junk prefix — take the $-amount)
 *   "Price: Call for Price"
 *   "Call for Price"
 */
function parseAskingPrice(raw: RawListing): number | null {
  const text = (raw.priceText || '').trim()
  if (text && /call|inquire|n\/?a|make offer/i.test(text) && !/\$/.test(text)) {
    return null
  }

  // Prefer an explicit "$1,234,567" amount embedded in priceText.
  const dollar = text.match(/\$\s*([\d,]+(?:\.\d+)?)/)
  if (dollar) {
    const n = Math.round(parseFloat(dollar[1].replace(/,/g, '')))
    if (Number.isFinite(n) && n > 0) return n
  }

  // Otherwise a bare numeric priceText like "169,000".
  const bare = text.match(/^[\s$]*([\d,]+(?:\.\d+)?)\s*(?:usd)?\s*$/i)
  if (bare) {
    const n = Math.round(parseFloat(bare[1].replace(/,/g, '')))
    if (Number.isFinite(n) && n > 0) return n
  }

  // Last resort: the numeric `price` field, de-duplicating the common doubling
  // bug (e.g. 195000195000 -> 195000).
  if (typeof raw.price === 'number' && raw.price > 0) {
    const s = String(Math.round(raw.price))
    if (s.length % 2 === 0) {
      const half = s.slice(0, s.length / 2)
      if (s.slice(s.length / 2) === half) {
        const n = parseInt(half, 10)
        if (Number.isFinite(n) && n > 0) return n
      }
    }
    return raw.price
  }

  return null
}

function flattenSections(sections?: Record<string, RawSection> | null): Record<string, string> {
  const out: Record<string, string> = {}
  if (!sections) return out
  for (const [key, sec] of Object.entries(sections)) {
    const content = (sec?.content || '').trim()
    if (content) out[key] = content
  }
  return out
}

function buildComparables(): Comparable[] {
  const db = rawDb as RawDb
  const listings = db.listings || {}
  const comps: Comparable[] = []

  for (const [id, raw] of Object.entries(listings)) {
    const askingPrice = parseAskingPrice(raw)
    if (askingPrice == null) continue // drop price-less listings

    const details = flattenSections(raw.sections)
    const searchText = [
      raw.makeModel,
      raw.modelGroup,
      raw.title,
      raw.category,
      raw.year ? String(raw.year) : null,
    ]
      .filter(Boolean)
      .join(' ')

    comps.push({
      listingId: raw.listingId || id,
      category: raw.category ?? null,
      modelGroup: raw.modelGroup ?? null,
      makeModel: raw.makeModel ?? null,
      title: raw.title ?? null,
      year: typeof raw.year === 'number' ? raw.year : null,
      askingPrice,
      registration: raw.registration ?? null,
      serialNumber: raw.serialNumber ?? null,
      totalTime: raw.totalTime ?? null,
      saleStatus: raw.saleStatus ?? null,
      location: raw.location ?? null,
      seller: raw.seller ?? null,
      description: raw.description ?? null,
      details,
      url: raw.url ?? null,
      searchText,
    })
  }

  return comps
}

let _comps: Comparable[] | null = null
let _fuse: Fuse<Comparable> | null = null

function comparables(): Comparable[] {
  if (!_comps) _comps = buildComparables()
  return _comps
}

function fuse(): Fuse<Comparable> {
  if (!_fuse) {
    _fuse = new Fuse(comparables(), {
      includeScore: true,
      ignoreLocation: true,
      threshold: 0.4, // moderately fuzzy; keeps obviously-wrong models out
      minMatchCharLength: 2,
      keys: [
        { name: 'makeModel', weight: 0.5 },
        { name: 'modelGroup', weight: 0.3 },
        { name: 'title', weight: 0.15 },
        { name: 'searchText', weight: 0.05 },
      ],
    })
  }
  return _fuse
}

export interface FindComparablesOptions {
  make: string
  model: string
  /** Max comps to return (default 6). Kept small to avoid context bloat. */
  limit?: number
}

/**
 * Fuzzy-search the internal database for comps matching a make/model.
 * Year is intentionally NOT used to filter — nearby years are useful comps.
 * Only price-bearing listings are ever returned.
 */
export function findComparables({ make, model, limit = 6 }: FindComparablesOptions): Comparable[] {
  const query = [make, model].filter(Boolean).join(' ').trim()
  if (!query) return []

  // Fuse extended search: AND the tokens so we don't match unrelated makes.
  const results = fuse().search(query, { limit: Math.max(limit * 3, 18) })

  const seen = new Set<string>()
  const out: Comparable[] = []
  for (const r of results) {
    if (seen.has(r.item.listingId)) continue
    seen.add(r.item.listingId)
    out.push(r.item)
    if (out.length >= limit) break
  }
  return out
}

/** Total number of price-bearing comparables available (for diagnostics). */
export function comparableCount(): number {
  return comparables().length
}

/**
 * Render a compact, complete text block for a set of comps, suitable for
 * injecting into an LLM prompt or returning from a tool call. Includes every
 * field that matters for valuation (price, year, hours, avionics, condition
 * notes) while trimming overly long free text.
 */
export function formatComparables(comps: Comparable[]): string {
  if (!comps.length) return 'No internal database comparables found for this make/model.'

  const trim = (s: string, max = 600): string =>
    s.length > max ? s.slice(0, max).trimEnd() + '…' : s

  const lines: string[] = []
  comps.forEach((c, i) => {
    const header = [
      c.year ? c.year : '',
      c.makeModel || c.modelGroup || c.title || 'Unknown model',
    ]
      .filter(Boolean)
      .join(' ')
    lines.push(`#${i + 1} — ${header} — ASKING $${c.askingPrice.toLocaleString('en-US')}`)
    if (c.totalTime && c.totalTime !== 'Not Listed') lines.push(`   TTAF: ${c.totalTime}`)
    if (c.location) lines.push(`   Location: ${c.location}`)
    if (c.saleStatus) lines.push(`   Status: ${c.saleStatus}`)
    const desc = c.description?.trim()
    if (desc) lines.push(`   Description: ${trim(desc)}`)
    for (const [key, val] of Object.entries(c.details)) {
      const label = key.replace(/_/g, ' ')
      lines.push(`   ${label}: ${trim(val)}`)
    }
    if (c.url) lines.push(`   Source: ${c.url}`)
    lines.push('')
  })
  return lines.join('\n').trimEnd()
}

/**
 * How many catalog listings like this make/model are for sale.
 * The Trade-A-Plane scrape is organized by series (CESSNA 172 SERIES), and
 * most rows never name the exact variant, so "172S" counts the 172 series.
 * Listings with no saleStatus are for sale. Sold, wanted, and fractional
 * rows are not. Call-for-price rows count as for sale.
 */
const SERIES_STOP = new Set(['SERIES', 'AIRCRAFT', 'AIRPLANE', 'THE', 'AND', 'OF'])

const MAKE_ALIASES: Record<string, string[]> = {
  CESSNA: ['CESSNA'],
  PIPER: ['PIPER'],
  BEECH: ['BEECH', 'BEECHCRAFT'],
  BEECHCRAFT: ['BEECH', 'BEECHCRAFT'],
  CIRRUS: ['CIRRUS'],
  MOONEY: ['MOONEY'],
  DIAMOND: ['DIAMOND'],
  ROBINSON: ['ROBINSON'],
  MAULE: ['MAULE'],
  GRUMMAN: ['GRUMMAN', 'AMERICAN'],
  AMERICAN: ['AMERICAN', 'GRUMMAN'],
  VANS: ['VANS', 'VAN'],
  VAN: ['VANS', 'VAN'],
  CUBCRAFTERS: ['CUBCRAFTERS'],
  COMMANDER: ['COMMANDER'],
  ROCKWELL: ['ROCKWELL', 'COMMANDER'],
  SOCATA: ['SOCATA'],
  BELL: ['BELL'],
  EXTRA: ['EXTRA'],
  AVIAT: ['AVIAT'],
}

/** Names the catalog stores as a series number rather than the marketing word. */
const WORD_TO_CODE: Record<string, string> = {
  SKYHAWK: '172',
  SKYLANE: '182',
  STATIONAIR: '206',
  CENTURION: '210',
  CARDINAL: '177',
  CUTLASS: '172',
  DEBONAIR: '33',
}

const TURBO_CODES = new Set(['T182', 'T206', 'T210', 'TR182', 'TU206', 'SR22T'])

interface SaleListing {
  id: string
  group: string
  tokens: Set<string>
  forSale: boolean
  priced: boolean
  year: number | null
}

interface SeriesBucket {
  name: string
  tokens: Set<string>
  listings: SaleListing[]
}

function tokenize(raw: string): string[] {
  let s = raw.toUpperCase().replace(/['’]S\b/g, '')
  s = s.replace(/([A-Z])-(\d)/g, '$1$2').replace(/(\d)-([A-Z])/g, '$1$2')
  s = s.replace(/[^A-Z0-9]+/g, ' ')
  const out: string[] = []
  for (const t of s.split(/\s+/)) {
    if (!t || SERIES_STOP.has(t) || /^[A-Z]$/.test(t)) continue
    out.push(t)
  }
  return out
}

function isCode(token: string): boolean {
  return /\d/.test(token)
}

/** Match keys from most specific to the series number the catalog actually uses. */
function codeKeys(token: string): string[] {
  const keys = [token]
  const m = /^([A-Z]*)(\d+)([A-Z]*)$/.exec(token)
  if (!m) return keys
  const letters = m[1] || ''
  const digits = m[2] || ''
  const suffix = m[3] || ''
  if (!digits) return keys
  if (suffix && letters) keys.push(letters + digits)
  else if (suffix) keys.push(digits)
  if (letters.length <= 1 && !keys.includes(digits)) keys.push(digits)
  return [...new Set(keys)]
}

function aliasesFor(token: string): string[] {
  return MAKE_ALIASES[token] || []
}

function isForSaleStatus(status: string | null | undefined): boolean {
  const s = (status || '').trim().toLowerCase()
  if (!s || s === 'for sale') return true
  return false
}

function partitionQuery(make: string, model: string): { makeTokens: string[]; modelTokens: string[] } {
  const makeTokens = tokenize(make)
  let modelTokens = tokenize(model)
  if (!makeTokens.length) {
    const found: string[] = []
    const rest: string[] = []
    for (const t of modelTokens) {
      if (MAKE_ALIASES[t]) found.push(t)
      else rest.push(t)
    }
    return { makeTokens: found, modelTokens: rest }
  }
  const makeSet = new Set(makeTokens.flatMap((t) => aliasesFor(t).concat(t)))
  modelTokens = modelTokens.filter((t) => !makeSet.has(t) && !MAKE_ALIASES[t])
  return { makeTokens, modelTokens }
}

function makeMatches(groupTokens: Set<string>, makeTokens: string[]): boolean {
  if (!makeTokens.length) return true
  const known = makeTokens.filter((t) => aliasesFor(t).length > 0)
  const unknown = makeTokens.filter((t) => aliasesFor(t).length === 0)
  if (known.length) {
    const aliases = known.flatMap((t) => aliasesFor(t))
    if (!aliases.some((a) => groupTokens.has(a))) return false
  } else if (unknown.some((t) => !groupTokens.has(t))) {
    return false
  }
  return true
}

function prettyToken(token: string): string {
  if (/\d/.test(token) || token.length <= 2) return token
  return token.charAt(0) + token.slice(1).toLowerCase()
}

function labelFromGroups(names: string[]): string {
  const tokenLists = names.map((name) => tokenize(name))
  let tokens = tokenLists[0] || []
  if (tokenLists.length > 1) {
    const rest = tokenLists.slice(1).map((list) => new Set(list))
    const common = tokens.filter((t) => rest.every((set) => set.has(t)))
    tokens = common.length ? common : tokens
  }
  return tokens.map(prettyToken).join(' ')
}

function formatSyncLabel(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d)
}

let _sales: SaleListing[] | null = null
let _buckets: SeriesBucket[] | null = null

function saleListings(): SaleListing[] {
  if (_sales) return _sales
  const db = rawDb as RawDb
  const listings = db.listings || {}
  const sales: SaleListing[] = []
  for (const [id, raw] of Object.entries(listings)) {
    const group = (raw.modelGroup || '').trim()
    const identity = [raw.makeModel, raw.title, raw.modelGroup].filter(Boolean).join(' ')
    sales.push({
      id: raw.listingId || id,
      group,
      tokens: new Set(tokenize(identity)),
      forSale: isForSaleStatus(raw.saleStatus),
      priced: parseAskingPrice(raw) != null,
      year: typeof raw.year === 'number' ? raw.year : null,
    })
  }
  _sales = sales
  return sales
}

function seriesBuckets(): SeriesBucket[] {
  if (_buckets) return _buckets
  const map = new Map<string, SaleListing[]>()
  for (const listing of saleListings()) {
    if (!listing.group || listing.group === 'NO MODEL GROUP') continue
    const rows = map.get(listing.group)
    if (rows) rows.push(listing)
    else map.set(listing.group, [listing])
  }
  _buckets = [...map.entries()].map(([name, listings]) => ({
    name,
    tokens: new Set(tokenize(name)),
    listings,
  }))
  return _buckets
}

function queryFlags(modelTokens: string[]): { turbo: boolean; pressurized: boolean } {
  const turbo =
    modelTokens.includes('TURBO') ||
    modelTokens.includes('TURBONORMALIZED') ||
    modelTokens.some((t) => TURBO_CODES.has(t))
  const pressurized =
    modelTokens.includes('PRESSURIZED') ||
    modelTokens.includes('PRESSURISED') ||
    modelTokens.includes('P210')
  return { turbo, pressurized }
}

export function countForSale(input: {
  make?: string
  model?: string
  year?: number | null
}): ForSaleCount {
  const make = (input.make || '').trim()
  const model = (input.model || '').trim()
  const { makeTokens, modelTokens } = partitionQuery(make, model)
  const year =
    typeof input.year === 'number' && input.year >= 1930 && input.year <= 2100 ? input.year : null
  const syncedAtLabel = formatSyncLabel((rawDb as RawDb).meta?.lastCatalogSyncCompletedAt)
  const queryLabel = [make, model].filter(Boolean).join(' ').trim() || 'this aircraft'

  const empty = {
    count: 0,
    pricedCount: 0,
    sameYearCount: year == null ? null : 0,
    series: [] as string[],
    label: queryLabel,
    syncedAtLabel,
  }
  if (!modelTokens.length) return empty

  const modelCodes: string[] = []
  const modelWords: string[] = []
  for (const token of modelTokens) {
    if (isCode(token)) modelCodes.push(token)
    else {
      const mapped = WORD_TO_CODE[token]
      if (mapped) modelCodes.push(mapped)
      modelWords.push(token)
    }
  }

  type Candidate = { bucket: SeriesBucket; score: number }
  const candidates: Candidate[] = []
  for (const bucket of seriesBuckets()) {
    if (!makeMatches(bucket.tokens, makeTokens)) continue
    let matchedKeyLen = 0
    for (const code of modelCodes) {
      for (const key of codeKeys(code)) {
        if (bucket.tokens.has(key) && key.length > matchedKeyLen) matchedKeyLen = key.length
      }
    }
    if (modelCodes.length && matchedKeyLen === 0) continue
    let wordScore = 0
    for (const word of modelWords) {
      if (bucket.tokens.has(word)) wordScore += 6
    }
    if (!matchedKeyLen && !wordScore) continue
    const score = (matchedKeyLen ? 20 + matchedKeyLen : 0) + wordScore + (makeTokens.length ? 4 : 0)
    candidates.push({ bucket, score })
  }

  let chosen = candidates
  if (chosen.some((c) => c.score >= 20)) chosen = chosen.filter((c) => c.score >= 20)

  const flags = queryFlags(modelTokens)
  if (chosen.length > 1 && flags.pressurized) {
    const pressed = chosen.filter((c) => c.bucket.tokens.has('PRESSURIZED'))
    if (pressed.length) chosen = pressed
  } else if (chosen.length > 1 && flags.turbo) {
    const turbo = chosen.filter((c) => c.bucket.tokens.has('TURBO'))
    if (turbo.length) chosen = turbo
  } else if (chosen.length > 1 && !flags.turbo && !flags.pressurized) {
    const plain = chosen.filter(
      (c) => !c.bucket.tokens.has('TURBO') && !c.bucket.tokens.has('PRESSURIZED'),
    )
    if (plain.length) chosen = plain
  }

  const best = chosen.reduce((max, c) => Math.max(max, c.score), 0)
  chosen = chosen.filter((c) => c.score === best && best > 0)

  const matched = new Map<string, SaleListing>()
  if (chosen.length) {
    for (const candidate of chosen) {
      for (const listing of candidate.bucket.listings) {
        if (listing.forSale) matched.set(listing.id, listing)
      }
    }
  } else {
    const makeAliases = makeTokens.flatMap((t) => {
      const aliases = aliasesFor(t)
      return aliases.length ? aliases : [t]
    })
    const requiredCodes = modelTokens.filter(isCode)
    const requiredWords = modelTokens.filter((t) => !isCode(t))
    if (requiredCodes.length || requiredWords.length) {
      for (const listing of saleListings()) {
        if (!listing.forSale) continue
        if (makeAliases.length && !makeAliases.some((a) => listing.tokens.has(a))) continue
        if (requiredCodes.some((code) => !listing.tokens.has(code))) continue
        if (requiredWords.some((word) => !listing.tokens.has(word))) continue
        matched.set(listing.id, listing)
      }
    }
  }

  if (!matched.size) return empty

  const listings = [...matched.values()]
  const series = chosen.map((c) => c.bucket.name)
  return {
    count: listings.length,
    pricedCount: listings.filter((l) => l.priced).length,
    sameYearCount: year == null ? null : listings.filter((l) => l.year === year).length,
    series,
    label: series.length ? labelFromGroups(series) : queryLabel,
    syncedAtLabel,
  }
}
