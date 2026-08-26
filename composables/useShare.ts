function siteShareUrlFromOrigin(origin: string) {
  return (origin || 'https://smallplanevalue.com').replace(/\/$/, '')
}

export function shareBlurbText(origin?: string) {
  const site = siteShareUrlFromOrigin(origin || (import.meta.client ? window.location.origin : 'https://smallplanevalue.com'))
  return 'Free GA aircraft valuations at ' + site + ' — honest asking ranges and fair-market estimates, no fabricated sale prices. Paste a listing or enter your aircraft. Looking for feedback from pilots — especially BeechTalk and type-club folks. Try it and tell us what we got right or wrong.'
}

export function useShare() {
  const req = useRequestURL()
  const origin = computed(() => {
    if (import.meta.client) return window.location.origin
    return req.origin
  })
  const facebookHref = computed(() => {
    const url = encodeURIComponent(siteShareUrlFromOrigin(origin.value))
    return 'https://www.facebook.com/sharer/sharer.php?u=' + url
  })
  const xHref = computed(() => {
    const text = encodeURIComponent(shareBlurbText(origin.value))
    return 'https://twitter.com/intent/tweet?text=' + text
  })
  const copyMsg = ref('')

  function fallbackCopy(text: string) {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
      copyMsg.value = 'Copied — paste into BeechTalk, Facebook groups, or Instagram.'
    } catch {
      copyMsg.value = 'Copy failed — select and copy manually from the address bar.'
    }
    document.body.removeChild(ta)
  }

  function copyShareBlurb() {
    const blurb = shareBlurbText()
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(blurb).then(() => {
        copyMsg.value = 'Copied — paste into BeechTalk, Facebook groups, or Instagram.'
      }).catch(() => fallbackCopy(blurb))
    } else {
      fallbackCopy(blurb)
    }
  }

  return { facebookHref, xHref, copyMsg, copyShareBlurb }
}
