import type { LookupRecord } from '~/types/app'

export function isTwinFromLookup(d: {
  aircraftType?: string
  numEngines?: string | number
} | null | undefined) {
  if (!d) return false
  const type = String(d.aircraftType || '').toLowerCase()
  if (type.indexOf('multi') >= 0) return true
  const n = Number(d.numEngines)
  return Number.isFinite(n) && n > 1
}

export function engineSelectFromMake(engineMake?: string | null) {
  if (!engineMake) return null
  const e = engineMake.toUpperCase()
  if (e.indexOf('LYCOMING') >= 0) return 'Lycoming'
  if (e.indexOf('CONT') >= 0) return 'Continental'
  if (e.indexOf('ROTAX') >= 0) return 'Rotax (LSA)'
  if (e.indexOf('TURB') >= 0 || e.indexOf('PT6') >= 0 || e.indexOf('PRATT') >= 0 || e.indexOf('GARRETT') >= 0) {
    return 'Turboprop'
  }
  return 'Other / unknown'
}

export function compsModelFromLookup(d: LookupRecord) {
  return [d.make, d.model].filter(Boolean).join(' ')
}
