<template>
  <div
    class="tab-pane"
    :class="{ active: activeTab === 'val' }"
    role="tabpanel"
    id="pane-val"
    data-testid="pane-val"
    aria-labelledby="tab-btn-val"
  >
    <ListingPaste />
    <div style="font-size:11px;color:var(--muted);text-align:center;margin-bottom:12px">or enter details manually</div>
    <IdentityFields />
    <EngineTimes />
    <ConditionFields />
    <AvionicsFields />
    <AvionicsItemize />
    <div class="form-group" style="margin-bottom:0">
      <label for="v-notes">NOTES (damage history, engine OH type, storage, special equipment)</label>
      <textarea id="v-notes" v-model="notes" placeholder="No damage history, all logs since new, hangared, factory reman engines at 200 SMOH, RAM conversion..."></textarea>
    </div>
    <button class="submit-btn accent-btn" id="v-btn" :disabled="loading" @click="doValuation">
      <i class="ti ti-calculator"></i> Get honest valuation
    </button>
    <Spinner id="v-spin" :on="loading" fly message="Searching live listings & recent sales..." :tip-html="partnerTip" />
    <div id="v-result" data-testid="valuation-result">
      <ValuationResult
        :v="result"
        :fail-msg="failMsg"
        :make="submittedMake"
        :model="submittedModel"
        :year="submittedYear"
        :listing-ask="submittedAsk"
      />
    </div>
    <p v-if="checkoutNotice" class="val-checkout-note" role="status">{{ checkoutNotice }}</p>
    <p class="val-free-note" id="v-free-note">3 free valuations per account, then $24 each or $75 for five.</p>
  </div>
</template>

<script setup lang="ts">
import type { ValuationResult } from '~/types/app'
import { TRUSTED_PARTNERS, partnerTipHtml } from '~/data/partners'
import { getOrCreateClientId, getValuationEmail } from '~/composables/useClientId'
import { trackEvent } from '~/composables/useAnalytics'

const { activeTab } = useToolsTab()
const { openLogin, openPaywall, getAccessToken, checkoutNotice } = useAuth()
const val = useValuationForm()
const notes = val.notes
const loading = ref(false)
const result = ref<ValuationResult | null>(null)
const failMsg = ref('')
const submittedMake = ref('')
const submittedModel = ref('')
const submittedYear = ref('')
const submittedAsk = ref(0)
const partnerTip = ref('')
let partnerTimer: ReturnType<typeof setInterval> | null = null
let partnerIndex = 0

function startPartnerTipRotation() {
  stopPartnerTipRotation()
  if (!TRUSTED_PARTNERS.length) return
  partnerIndex = 0
  partnerTip.value = partnerTipHtml(TRUSTED_PARTNERS[partnerIndex])
  if (TRUSTED_PARTNERS.length < 2) return
  partnerTimer = setInterval(() => {
    partnerIndex = (partnerIndex + 1) % TRUSTED_PARTNERS.length
    partnerTip.value = partnerTipHtml(TRUSTED_PARTNERS[partnerIndex])
  }, 4000)
}

function stopPartnerTipRotation() {
  if (partnerTimer) {
    clearInterval(partnerTimer)
    partnerTimer = null
  }
}

async function doValuation() {
  const id = val.identity()
  if (!id.make || !id.model) {
    alert('Enter make and model.')
    return
  }

  const accessToken = await getAccessToken()
  if (!accessToken) {
    openLogin()
    return
  }

  await val.refreshEngineLife()
  const body = val.buildValuationPayload({
    clientId: getOrCreateClientId(),
    email: getValuationEmail() || null,
  })
  if (!body) {
    alert('Enter make and model.')
    return
  }

  loading.value = true
  startPartnerTipRotation()
  result.value = null
  failMsg.value = ''
  checkoutNotice.value = ''
  try {
    const v = await apiPost<ValuationResult>('/api/valuate', body, { accessToken })
    submittedMake.value = body.make
    submittedModel.value = body.model
    submittedYear.value = body.year
    submittedAsk.value = body.asking ? parseInt(body.asking, 10) : 0
    result.value = v
    val.hasResult.value = true
    trackEvent('valuation_completed', { make: body.make, model: body.model })
  } catch (e) {
    const err = e as Error & { status?: number }
    if (err.status === 401) {
      openLogin()
    } else if (err.status === 402 || err.code === 'credits_required') {
      openPaywall()
    } else {
      console.error('Valuation error:', e)
      failMsg.value = err.message || String(e)
    }
  }
  loading.value = false
  stopPartnerTipRotation()
}

watch(() => val.hasResult.value, (on) => {
  if (!on) {
    result.value = null
    failMsg.value = ''
  }
})
</script>
