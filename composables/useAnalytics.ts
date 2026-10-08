declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export const GA_MEASUREMENT_ID = 'G-9ET7HJRJWC'

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', name, params || {})
}

export function trackBrokerContact(destination: string) {
  trackEvent('broker_contact_click', { destination })
}
