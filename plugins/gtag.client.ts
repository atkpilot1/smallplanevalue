import { GA_MEASUREMENT_ID } from '~/composables/useAnalytics'

export default defineNuxtPlugin(() => {
  window.dataLayer = window.dataLayer || []
  // Do not replace gtag.js after it loads — that was dropping custom events
  // (page_view still showed in GA, key events stayed at 0).
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      // Google's snippet pushes the Arguments object, not a rest-parameter array.
      window.dataLayer!.push(arguments)
    }
  }
  const debug = new URLSearchParams(location.search).has('ga_debug')
  window.gtag('js', new Date())
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: true,
    ...(debug ? { debug_mode: true } : {}),
  })
})
