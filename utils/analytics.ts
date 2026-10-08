/** GA4 event names for the actions that measure SmallPlaneValue traction. */
export const KEY_EVENTS = {
  valuationStarted: 'valuation_started',
  valuationCompleted: 'valuation_completed',
  accountCreated: 'sign_up',
  brokerContactClick: 'broker_contact_click',
  salesInquirySubmit: 'sales_inquiry_submit',
  aircraftInfoView: 'aircraft_info_view',
} as const

export type KeyEventName = (typeof KEY_EVENTS)[keyof typeof KEY_EVENTS]

/**
 * Outbound hosts that take a visitor to a broker, dealer, listing marketplace,
 * or the site's sales partner. FAA, type clubs, and social shares are not included.
 */
const BROKER_HOSTS: Record<string, string> = {
  'airlogbooks.com': 'AirLogbooks',
  'trade-a-plane.com': 'Trade-A-Plane',
  'controller.com': 'Controller',
  'barnstormers.com': 'Barnstormers',
}

/** Server timestamps written in the same verify call can differ by a second or two. */
const NEW_ACCOUNT_MATCH_MS = 5_000
/** Tolerate client/server clock skew. A later sign-in moves last_sign_in_at away from confirmation. */
const NEW_ACCOUNT_FRESH_MS = 24 * 60 * 60 * 1000

export interface AccountTimestamps {
  email_confirmed_at?: string | null
  confirmed_at?: string | null
  last_sign_in_at?: string | null
}

/**
 * True when this auth payload is the first confirmation of a new account.
 * Returning OTP sign-ins keep the original confirmation time and refresh last_sign_in_at.
 */
export function isNewAccount(user: AccountTimestamps, now = Date.now()): boolean {
  const confirmed = Date.parse(user.email_confirmed_at || user.confirmed_at || '')
  if (!Number.isFinite(confirmed)) return false
  if (Math.abs(now - confirmed) > NEW_ACCOUNT_FRESH_MS) return false
  const signedIn = Date.parse(user.last_sign_in_at || '')
  if (!Number.isFinite(signedIn)) return true
  return Math.abs(signedIn - confirmed) <= NEW_ACCOUNT_MATCH_MS
}

export interface BrokerContact {
  link_domain: string
  partner: string
}

/** Classify an href as a broker/partner contact, or return null. */
export function brokerContactFromHref(href: string, base = 'https://smallplanevalue.com'): BrokerContact | null {
  let url: URL
  try {
    url = new URL(href, base)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  const link_domain = url.hostname.toLowerCase().replace(/^www\./, '')
  const partner = BROKER_HOSTS[link_domain]
  if (!partner) return null
  return { link_domain, partner }
}
