import { KEY_EVENTS } from '~/utils/analytics'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', name, params || {})
}

export function trackValuationStarted(aircraft: { make: string; model: string; year?: string }) {
  trackEvent(KEY_EVENTS.valuationStarted, {
    make: aircraft.make,
    model: aircraft.model,
    year: aircraft.year || '',
  })
}

export function trackValuationCompleted(aircraft: { make: string; model: string; year?: string }) {
  trackEvent(KEY_EVENTS.valuationCompleted, {
    make: aircraft.make,
    model: aircraft.model,
    year: aircraft.year || '',
  })
}

/** GA4 recommended event. Fires once per new account, not on later sign-ins. */
export function trackAccountCreated() {
  trackEvent(KEY_EVENTS.accountCreated, { method: 'email' })
}

export function trackAircraftInfoView(aircraft: { n_number?: string; make?: string; model?: string; year?: string }) {
  trackEvent(KEY_EVENTS.aircraftInfoView, {
    n_number: aircraft.n_number || '',
    make: aircraft.make || '',
    model: aircraft.model || '',
    year: aircraft.year || '',
  })
}

export function trackSalesInquiry(aircraft: { n_number?: string; make?: string; model?: string }) {
  trackEvent(KEY_EVENTS.salesInquirySubmit, {
    n_number: aircraft.n_number || '',
    make: aircraft.make || '',
    model: aircraft.model || '',
  })
}

export function trackBrokerContact(link: { link_url: string; link_domain?: string; partner?: string; link_text?: string }) {
  trackEvent(KEY_EVENTS.brokerContactClick, {
    link_url: link.link_url,
    link_domain: link.link_domain || '',
    partner: link.partner || '',
    link_text: (link.link_text || '').replace(/\s+/g, ' ').trim().slice(0, 80),
  })
}
