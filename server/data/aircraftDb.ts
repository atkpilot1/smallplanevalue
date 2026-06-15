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

interface RawDb {
  meta?: unknown
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
