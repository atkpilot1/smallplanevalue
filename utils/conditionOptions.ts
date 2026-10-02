export const OVERALL_CONDITION_OPTIONS = [
  'Excellent — like new',
  'Good — minor wear',
  'Fair — visible wear',
  'Poor — needs work',
] as const

export const PAINT_CONDITION_OPTIONS = [
  'New / recently painted',
  'Good',
  'Original (age-typical wear)',
  'Fair — faded, chips, or hangar rash',
  'Needs paint',
] as const

export const INTERIOR_CONDITION_OPTIONS = [
  'Brand new / recently redone',
  'Good',
  'Original (age-typical wear)',
  'Fair / dated',
  'Needs refurbishment',
] as const

export const DEFAULT_OVERALL_CONDITION = 'Good — minor wear'
export const DEFAULT_PAINT_CONDITION = 'Good'
export const DEFAULT_INTERIOR_CONDITION = 'Good'

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/[—–]/g, '-').replace(/\s+/g, ' ')
}

function matchOption(raw: string | null | undefined, options: readonly string[]): string | undefined {
  if (!raw) return undefined
  const n = normalize(raw)
  const exact = options.find((o) => normalize(o) === n)
  if (exact) return exact
  const contained = options.find((o) => n.includes(normalize(o)) || normalize(o).includes(n))
  if (contained) return contained
  return undefined
}

export function matchOverallCondition(raw: string | null | undefined) {
  const hit = matchOption(raw, OVERALL_CONDITION_OPTIONS)
  if (hit) return hit
  const n = normalize(raw || '')
  if (!n) return undefined
  if (/excellent|like new|pristine/.test(n)) return 'Excellent — like new'
  if (/poor|needs work|rough/.test(n)) return 'Poor — needs work'
  if (/fair|visible wear/.test(n)) return 'Fair — visible wear'
  if (/good|minor wear|average/.test(n)) return 'Good — minor wear'
  return undefined
}

export function matchPaintCondition(raw: string | null | undefined) {
  const hit = matchOption(raw, PAINT_CONDITION_OPTIONS)
  if (hit) return hit
  const n = normalize(raw || '')
  if (!n) return undefined
  if (/need[s]? paint|oxidiz|bare metal|poor paint/.test(n)) return 'Needs paint'
  if (/original|unrestored|factory paint/.test(n)) {
    return 'Original (age-typical wear)'
  }
  if (/fair|faded|chip|hangar rash|oxid/.test(n)) return 'Fair — faded, chips, or hangar rash'
  if (/new paint|recent(ly)? paint|fresh paint|stripped and painted/.test(n)) return 'New / recently painted'
  if (/good|excellent|average/.test(n)) return 'Good'
  return undefined
}

export function matchInteriorCondition(raw: string | null | undefined) {
  const hit = matchOption(raw, INTERIOR_CONDITION_OPTIONS)
  if (hit) return hit
  const n = normalize(raw || '')
  if (!n) return undefined
  if (/need[s]? refurb|worn out|cracked (leather|plastic)|poor interior/.test(n)) return 'Needs refurbishment'
  if (/brand new|recent(ly)? (redone|done|replaced)|new (leather|interior|seats)|redone in/.test(n)) {
    return 'Brand new / recently redone'
  }
  if (/original|unrestored|factory interior/.test(n)) return 'Original (age-typical wear)'
  if (/fair|dated|tired|worn/.test(n)) return 'Fair / dated'
  if (/good|excellent|average/.test(n)) return 'Good'
  return undefined
}

export function migrateLegacyCosmetics(cosm: string | null | undefined): {
  paint: string
  interior: string
} {
  const n = normalize(cosm || '')
  if (!n) {
    return { paint: DEFAULT_PAINT_CONDITION, interior: DEFAULT_INTERIOR_CONDITION }
  }
  if (/fresh paint|new interior/.test(n)) {
    return { paint: 'New / recently painted', interior: 'Brand new / recently redone' }
  }
  if (/needs refurb/.test(n)) {
    return { paint: 'Needs paint', interior: 'Needs refurbishment' }
  }
  if (/fair|dated|average/.test(n)) {
    return { paint: 'Fair — faded, chips, or hangar rash', interior: 'Fair / dated' }
  }
  return { paint: DEFAULT_PAINT_CONDITION, interior: DEFAULT_INTERIOR_CONDITION }
}

export function composeCosmetics(paint: string, interior: string) {
  return 'Paint/exterior: ' + paint + '; Interior: ' + interior
}
