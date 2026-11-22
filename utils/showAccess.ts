/** Accounts that can value walk-up aircraft without using the public free allowance. */
const BUILT_IN_SHOW_EMAILS = ['jpwallacejr@gmail.com']

export function showEmails(): string[] {
  const raw = typeof process !== 'undefined' ? process.env.SPV_SHOW_EMAILS || '' : ''
  const extra = raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.includes('@'))
  return [...new Set([...BUILT_IN_SHOW_EMAILS, ...extra])]
}

export function isShowEmail(email: string | null | undefined): boolean {
  const normalized = (email || '').trim().toLowerCase()
  return normalized.length > 0 && showEmails().includes(normalized)
}
