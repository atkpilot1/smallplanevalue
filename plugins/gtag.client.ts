export default defineNuxtPlugin(() => {
  window.dataLayer = window.dataLayer || []
  function gtag(...args: unknown[]) {
    window.dataLayer!.push(args)
  }
  gtag('js', new Date())
  const GA_ID = 'G-9ET7HJRJWC'
  const GA_DEBUG = new URLSearchParams(location.search).has('ga_debug')
  gtag('config', GA_ID, GA_DEBUG ? { debug_mode: true } : {})
  window.gtag = gtag
})
