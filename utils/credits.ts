/** Lifetime free valuations. Passed into `consume_valuation` / `refund_valuation`. */
export const FREE_VALUATIONS = 3

export type CreditProfile = {
  valuation_count: number
  credit_balance: number
}

export function freeRemaining(profile: CreditProfile) {
  return Math.max(0, FREE_VALUATIONS - profile.valuation_count)
}

export function remaining(profile: CreditProfile) {
  return freeRemaining(profile) + profile.credit_balance
}

export function canValuate(profile: CreditProfile) {
  return remaining(profile) > 0
}
