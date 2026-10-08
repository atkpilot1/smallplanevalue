import { trackBrokerContact } from '~/composables/useAnalytics'
import { brokerContactFromHref, KEY_EVENTS } from '~/utils/analytics'

function onDocumentClick(event: MouseEvent) {
  const target = event.target
  if (!(target instanceof Element)) return
  const link = target.closest('a')
  if (!(link instanceof HTMLAnchorElement)) return
  const href = link.href
  if (!href) return
  const classified = brokerContactFromHref(href)
  const marked = link.dataset.gaEvent === KEY_EVENTS.brokerContactClick
  if (!classified && !marked) return
  trackBrokerContact({
    link_url: href,
    link_domain: classified?.link_domain || '',
    partner: link.dataset.gaLabel || classified?.partner || '',
    link_text: link.textContent || '',
  })
}

export default defineNuxtPlugin(() => {
  window.dataLayer = window.dataLayer || []
  function gtag(...args: unknown[]) {
    window.dataLayer!.push(args)
  }
  gtag('js', new Date())
  const GA_ID = 'G-1Y4143JY7Y'
  const GA_DEBUG = new URLSearchParams(location.search).has('ga_debug')
  gtag('config', GA_ID, GA_DEBUG ? { debug_mode: true } : {})
  window.gtag = gtag

  const flag = '__spvGaClicks'
  const w = window as Window & { [flag]?: boolean }
  if (!w[flag]) {
    w[flag] = true
    document.addEventListener('click', onDocumentClick)
  }
})
