<template>
  <AppNav />
  <HeroSection :planes="planes || []" />
  <WhySection />
  <HowItWorksSection />
  <ToolsSection />
  <AircraftTypesSection />
  <ToolsApp />
  <AppDisclaimer />
  <AppFooter />
</template>

<script setup lang="ts">
import { pickPlanes, showcasePeriod } from '~/utils/showcase'
import { trackEvent } from '~/composables/useAnalytics'
import { STATE } from '~/utils/stateKeys'

const { data: planes } = await useAsyncData('showcase', () => {
  return pickPlanes(3, showcasePeriod(process.env.SHOWCASE_PERIOD))
})

const { switchTab } = useToolsTab()
const { handleCheckoutReturn } = useAuth()
const pendingLookup = useState(STATE.pendingLookup, () => '')

onMounted(() => {
  const params = new URLSearchParams(location.search)
  const n = params.get('n')
  if (n) {
    const nn = n.replace(/^N/i, '').trim().toUpperCase()
    if (nn) {
      trackEvent('ntailnum_referral', {
        utm_source: params.get('utm_source') || 'ntailnum',
        utm_medium: params.get('utm_medium') || '',
        utm_campaign: params.get('utm_campaign') || '',
      })
      switchTab('lookup')
      setTimeout(() => { pendingLookup.value = nn }, 300)
    }
  }

  if (params.get('tab') === 'val') switchTab('val')
  handleCheckoutReturn(params)
})
</script>
