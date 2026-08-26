<template>
  <div v-if="failMsg" style="color:var(--danger);font-size:14px;margin-top:1rem">Failed: {{ failMsg }}</div>
  <div v-else-if="v" class="result-card">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1rem">
      <div>
        <div style="font-size:12px;font-weight:500;color:var(--muted);letter-spacing:.04em;margin-bottom:4px">AIRCRAFT VALUATION</div>
        <div class="result-main-val">{{ fmt(fmv) }}</div>
        <div class="result-range">{{ year || '' }} {{ make }} {{ model }} · fair market value</div>
      </div>
      <span class="badge" :class="v.confidence === 'high' ? 'bg-green' : 'bg-amber'">
        <i class="ti" :class="v.confidence === 'high' ? 'ti-circle-check' : 'ti-alert-circle'" style="font-size:12px"></i>
        {{ v.confidence === 'high' ? 'High' : 'Moderate' }} confidence
      </span>
    </div>
    <div
      v-if="listingGap"
      style="background:rgba(232,160,32,0.12);border:1px solid rgba(232,160,32,0.35);border-radius:var(--radius);padding:12px 14px;margin-bottom:1rem;font-size:13px;color:var(--sky)"
    >
      <strong>Listing ask:</strong> {{ fmt(listingAsk) }} — <span :style="{ color: listingGap.color, fontWeight: 600 }">{{ listingGap.label }} our fair market value</span>
      <template v-if="marketAsk"> · Typical market list for comps: {{ fmt(marketAsk) }}</template>
    </div>
    <div v-if="listingNarrative" class="listing-narrative">
      <div class="listing-narrative-hdr"><i class="ti ti-report-analytics"></i> LISTING VS MARKET</div>
      <div class="listing-narrative-body">{{ listingNarrative }}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:1rem">
      <div style="text-align:center;padding:14px 8px;background:var(--offwhite);border-radius:var(--radius)">
        <div style="font-size:11px;font-weight:500;color:var(--muted);letter-spacing:.04em;margin-bottom:4px">BUYER TARGET</div>
        <div style="font-size:22px;font-weight:700;color:#27ae60">{{ fmt(buyer) }}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px">negotiate to this</div>
      </div>
      <div style="text-align:center;padding:14px 8px;background:var(--sky);border-radius:var(--radius)">
        <div style="font-size:11px;font-weight:500;color:rgba(255,255,255,0.7);letter-spacing:.04em;margin-bottom:4px">FAIR MARKET VALUE</div>
        <div style="font-size:22px;font-weight:700;color:#fff">{{ fmt(fmv) }}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:2px">realistic price</div>
      </div>
      <div style="text-align:center;padding:14px 8px;background:var(--offwhite);border-radius:var(--radius)">
        <div style="font-size:11px;font-weight:500;color:var(--muted);letter-spacing:.04em;margin-bottom:4px">TYPICAL MARKET ASK</div>
        <div style="font-size:22px;font-weight:700;color:#c0392b">{{ fmt(seller) }}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px">from comps, not your listing</div>
      </div>
    </div>
    <div class="price-bar-wrap">
      <div class="pbar-labels"><span>{{ fmt(buyer) }}</span><span style="color:var(--muted)">valuation range</span><span>{{ fmt(seller) }}</span></div>
      <div class="pbar-track">
        <div class="pbar-range"></div>
        <div class="pbar-pin" :style="{ left: fmvPct + '%' }"><div class="pbar-pin-lbl">{{ fmt(fmv) }}</div></div>
      </div>
    </div>
    <div style="background:var(--offwhite);border-radius:var(--radius);padding:12px 14px;margin:1rem 0;font-size:13px;color:var(--muted)">
      <strong style="color:var(--sky)">How this works:</strong> Fair Market Value is what the aircraft is realistically worth today. Buyer Target is a strong negotiating position. Typical Market Ask is what similar listings ask — if you entered a listing price, it is shown separately above.
    </div>
    <div class="metric-row">
      <div class="metric"><div class="metric-val">{{ v.condVerdict }}</div><div class="metric-lbl">Condition</div><div class="metric-note" :class="impactClass(v.condImpact)">{{ v.condImpact || '—' }} vs avg</div></div>
      <div class="metric"><div class="metric-val">{{ v.avVerdict }}</div><div class="metric-lbl">Avionics</div><div class="metric-note" :class="impactClass(v.avImpact)">{{ v.avImpact || '—' }} vs avg</div></div>
      <div class="metric"><div class="metric-val">{{ v.engineVerdict }}</div><div class="metric-lbl">Engine</div><div class="metric-note" :class="impactClass(v.engineImpact)">{{ v.engineImpact || '—' }} vs avg</div></div>
    </div>
    <div
      v-if="lifeBlocks.length"
      style="margin:1rem 0;padding:14px 16px;background:rgba(19,64,116,0.04);border-radius:var(--radius);border:1px solid rgba(19,64,116,0.08)"
    >
      <div style="font-size:12px;font-weight:600;color:var(--sky);margin-bottom:12px;letter-spacing:.04em;display:flex;align-items:center;gap:6px"><i class="ti ti-engine"></i> ENGINE LIFE — SMOH vs TBO</div>
      <template v-for="(e, i) in lifeBlocks" :key="i">
        <div v-if="i > 0" style="height:10px"></div>
        <EngineLifeBar :label="e.label" :smoh="e.smoh" :tbo="e.tbo" :life="e.life" />
      </template>
    </div>
    <div class="val-accuracy-row" id="val-accuracy-row">
      <div class="val-accuracy-label">How was this valuation?</div>
      <div class="val-accuracy-btns">
        <button type="button" class="val-acc-btn" :class="{ selected: selectedAcc === 'low' }" data-acc="low" :aria-pressed="selectedAcc === 'low' ? 'true' : 'false'" :disabled="accSubmitted" @click="submitAccuracy('low')">Too low</button>
        <button type="button" class="val-acc-btn" :class="{ selected: selectedAcc === 'right' }" data-acc="right" :aria-pressed="selectedAcc === 'right' ? 'true' : 'false'" :disabled="accSubmitted" @click="submitAccuracy('right')">About right</button>
        <button type="button" class="val-acc-btn" :class="{ selected: selectedAcc === 'high' }" data-acc="high" :aria-pressed="selectedAcc === 'high' ? 'true' : 'false'" :disabled="accSubmitted" @click="submitAccuracy('high')">Too high</button>
      </div>
      <div class="val-accuracy-msg" id="val-accuracy-msg" :style="{ color: accMsg ? 'var(--success)' : undefined }">{{ accMsg }}</div>
    </div>
    <div style="font-size:13px;font-weight:500;color:var(--sky);margin-bottom:.75rem;padding:10px 14px;background:rgba(19,64,116,0.06);border-radius:var(--radius)">{{ v.keyFinding }}</div>
    <div class="analysis-text">{{ v.analysis }}</div>
    <div v-if="tips.length" style="margin-top:1rem;padding-top:1rem;border-top:1px solid rgba(11,37,69,0.08)">
      <div style="font-size:12px;font-weight:500;color:var(--muted);margin-bottom:6px;letter-spacing:.04em">NEGOTIATING GUIDANCE</div>
      <div class="tip-list">
        <div v-for="(t, i) in tips" :key="i" class="tip-item"><i class="ti ti-arrow-right"></i><span>{{ t }}</span></div>
      </div>
    </div>
    <div class="note-box" style="margin-top:1rem">AI-generated for research purposes only. Not a certified appraisal. Engage an ASA-certified appraiser for financing or insurance.</div>
  </div>
</template>

<script setup lang="ts">
import type { ValuationResult } from '~/types/app'
import { fmt, impactClass } from '~/utils/format'
import { buildListingNarrative } from '~/utils/listingNarrative'
import { sendAppFeedback } from '~/composables/useFeedback'
import { trackEvent } from '~/composables/useAnalytics'

const props = defineProps<{
  v: ValuationResult | null
  failMsg: string
  make: string
  model: string
  year: string
  listingAsk: number
}>()

const val = useValuationForm()

const marketAsk = computed(() => props.v ? (props.v.sellerAsk || props.v.askHigh || 0) : 0)
const seller = computed(() => marketAsk.value || props.listingAsk)
const fmv = computed(() => props.v ? (props.v.fairMarketValue || props.v.askMid || 0) : 0)
const buyer = computed(() => props.v ? (props.v.buyerTarget || props.v.askLow || 0) : 0)
const fmvPct = computed(() => {
  const total = seller.value - buyer.value
  return total > 0 ? Math.round((fmv.value - buyer.value) / total * 100) : 50
})
const listingNarrative = computed(() =>
  props.v ? buildListingNarrative(props.listingAsk, fmv.value, buyer.value, marketAsk.value, props.v, val.lastEngineLife.value) : '',
)
const listingGap = computed(() => {
  if (!(props.listingAsk > 0 && fmv.value > 0 && props.listingAsk !== marketAsk.value)) return null
  const gapPct = Math.round((props.listingAsk - fmv.value) / fmv.value * 100)
  return {
    label: gapPct > 0 ? gapPct + '% above' : Math.abs(gapPct) + '% below',
    color: gapPct > 15 ? 'var(--danger)' : gapPct > 5 ? 'var(--warn)' : 'var(--success)',
  }
})
const lifeBlocks = computed(() => val.lastEngineLife.value?.engines || [])
const tips = computed(() => props.v?.negotiatingTips || [])

const selectedAcc = ref('')
const accSubmitted = ref(false)
const accMsg = ref('')

watch(() => props.v, () => {
  selectedAcc.value = ''
  accSubmitted.value = false
  accMsg.value = ''
})

async function submitAccuracy(accuracy: string) {
  if (accSubmitted.value) return
  const aircraft = [props.year, props.make, props.model].filter(Boolean).join(' ')
  let msg = 'Post-valuation rating. FMV: $' + (fmv.value || 0).toLocaleString()
  if (props.listingAsk) msg += ', Listing ask: $' + props.listingAsk.toLocaleString()
  if (buyer.value) msg += ', Buyer target: $' + buyer.value.toLocaleString()
  msg += '.'
  await sendAppFeedback({ aircraft, accuracy, message: msg })
  trackEvent('valuation_accuracy_feedback', {
    accuracy,
    make: props.make || '',
    model: props.model || '',
    fmv: fmv.value || 0,
    listing_ask: props.listingAsk || 0,
  })
  accSubmitted.value = true
  selectedAcc.value = accuracy
  accMsg.value = 'Thanks — your rating helps us improve valuations.'
}
</script>
