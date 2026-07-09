import { timingSafeEqual } from 'node:crypto'

function parseEvaluatorCodes(raw: string | undefined): string[] {
  return (raw || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
}

function codesMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

function evaluatorCodesRaw(): string {
  const config = useRuntimeConfig()
  // Read env at request time — Vercel injects SPV_EVALUATOR_CODES on each invocation.
  // NUXT_EVALUATOR_CODES is the Nuxt runtime override when evaluatorCodes defaults to ''.
  return (
    process.env.SPV_EVALUATOR_CODES ||
    process.env.NUXT_EVALUATOR_CODES ||
    String(config.evaluatorCodes || '')
  )
}

/** True when `code` matches one of the comma-separated SPV_EVALUATOR_CODES env values. */
export function isValidEvaluatorCode(code: string | null | undefined): boolean {
  const normalized = (code || '').trim()
  if (!normalized) return false

  const codes = parseEvaluatorCodes(evaluatorCodesRaw())
  if (!codes.length) return false

  return codes.some((valid) => codesMatch(normalized, valid))
}

export function evaluatorCodesConfigured(): boolean {
  return parseEvaluatorCodes(evaluatorCodesRaw()).length > 0
}
