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

/** True when `code` matches one of the comma-separated SPV_EVALUATOR_CODES env values. */
export function isValidEvaluatorCode(code: string | null | undefined): boolean {
  const normalized = (code || '').trim()
  if (!normalized) return false

  const config = useRuntimeConfig()
  const codes = parseEvaluatorCodes(config.evaluatorCodes as string | undefined)
  if (!codes.length) return false

  return codes.some((valid) => codesMatch(normalized, valid))
}
