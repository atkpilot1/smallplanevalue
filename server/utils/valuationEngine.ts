/**
 * Deterministic engine-condition adjustment layered on a base airframe value.
 * Avionics adjustments live in avionicsAdjustments.ts.
 */

export interface EngineConfig {
  tbo: number
  overhaulCost: number
  reference: 'midtime' | 'fresh' | 'runout'
}

export interface EngineInput {
  smoh?: number
  tbo?: number
  overhaulCost?: number
  reference?: 'midtime' | 'fresh' | 'runout'
}

export interface EngineAdjustmentResult {
  adj: number
  perHour: number
  remaining: number | null
  reference?: 'midtime' | 'fresh' | 'runout'
  note?: string
}

const DEFAULT_ENGINE: EngineConfig = {
  tbo: 2000,
  overhaulCost: 65000,
  reference: 'midtime',
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x))
}

function round(x: number): number {
  return Math.round(x)
}

// reference="midtime": base assumes a mid-time engine; fresh adds up to +overhaulCost/2, run-out subtracts up to overhaulCost/2.
// reference="fresh":   base assumes a fresh engine; only penalizes as hours accrue (0 to -overhaulCost).
// reference="runout":  base assumes a run-out engine; fresh adds full overhaulCost.
export function engineAdjustment(engine: EngineInput = {}, ecfg: EngineConfig = DEFAULT_ENGINE): EngineAdjustmentResult {
  const tbo = engine.tbo || ecfg.tbo
  const overhaulCost = engine.overhaulCost || ecfg.overhaulCost
  const reference = engine.reference || ecfg.reference
  const perHour = overhaulCost / tbo
  if (engine.smoh == null) return { adj: 0, perHour: round(perHour), remaining: null, note: 'SMOH unknown — no engine adjustment' }

  const consumed = clamp(engine.smoh / tbo, 0, 1)
  let adj: number
  if (reference === 'fresh') adj = -overhaulCost * consumed
  else if (reference === 'runout') adj = overhaulCost * (1 - consumed)
  else adj = overhaulCost * (0.5 - consumed)

  const remaining = overhaulCost * Math.max(0, (tbo - engine.smoh) / tbo)
  return { adj: round(adj), perHour: round(perHour), remaining: round(remaining), reference }
}
