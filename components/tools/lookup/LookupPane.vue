<template>
  <div
    class="tab-pane"
    :class="{ active: activeTab === 'lookup' }"
    role="tabpanel"
    id="pane-lookup"
    data-testid="pane-lookup"
    aria-labelledby="tab-btn-lookup"
  >
    <div class="n-row">
      <div style="flex:1">
        <label for="nn" style="display:block;font-size:12px;font-weight:500;color:var(--muted);margin-bottom:5px;letter-spacing:.03em">N-NUMBER</label>
        <div style="display:flex">
          <div class="n-prefix">N</div>
          <input
            type="text"
            id="nn"
            class="n-input form-group"
            placeholder="12345 or SR22T"
            style="border-radius:0 var(--radius) var(--radius) 0;font-family:var(--mono);font-size:16px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;border:1px solid rgba(11,37,69,0.15);padding:9px 12px;background:var(--white);color:var(--sky);outline:none;flex:1"
            :value="nnumber"
            @input="onInput"
            @keydown.enter="doLookup"
          />
        </div>
      </div>
      <button class="n-lookup-btn" id="nn-btn" :disabled="loading" @click="doLookup">
        <i class="ti ti-search"></i> Look up
      </button>
    </div>
    <div class="ex-btns">
      <span class="ex-lbl">Try:</span>
      <button class="ex-btn" @click="tryN('172SP')">172SP</button>
      <button class="ex-btn" @click="tryN('RV10')">RV10</button>
      <button class="ex-btn" @click="tryN('SR22T')">SR22T</button>
      <button class="ex-btn" @click="tryN('PA28')">PA28</button>
      <button class="ex-btn" @click="tryN('C182')">C182</button>
    </div>
    <Spinner id="nn-spin" :on="loading" message="Querying FAA registry..." />
    <div id="nn-result" data-testid="lookup-result">
      <LookupResult :d="result" :not-found="notFound" :error="errored" :raw="lastRaw" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LookupRecord } from '~/types/app'
import { isTwinFromLookup } from '~/utils/lookupPrefill'
import { STATE } from '~/utils/stateKeys'

const { activeTab } = useToolsTab()
const ctx = useAircraftContext()
const val = useValuationForm()
const checklist = useChecklistForm()
const nnumber = useState(STATE.nnumber, () => '')
const loading = ref(false)
const result = ref<LookupRecord | null>(null)
const notFound = ref(false)
const errored = ref(false)
const lastRaw = ref('')
const pendingLookup = useState(STATE.pendingLookup, () => '')

watch(pendingLookup, (v) => {
  if (!v) return
  nnumber.value = v
  pendingLookup.value = ''
  doLookup()
})

function onInput(e: Event) {
  const el = e.target as HTMLInputElement
  nnumber.value = el.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function tryN(v: string) {
  nnumber.value = v
  doLookup()
}

async function doLookup() {
  checklist.clearResults()
  ctx.clearLookupExtras()
  const raw = nnumber.value.trim().toUpperCase()
  if (!raw) {
    alert('Enter an N-number.')
    return
  }
  lastRaw.value = raw
  loading.value = true
  result.value = null
  notFound.value = false
  errored.value = false
  val.resetForm()
  val.paste.value = ''

  try {
    const d = await apiPost<LookupRecord>('/api/faa-lookup', { nnumber: raw })
    if (!d.found) {
      notFound.value = true
      loading.value = false
      return
    }
    d.ownerHistory = [{
      name: d.registrantName || 'Unknown',
      city: d.city || '',
      state: d.state || '',
      from: d.certDate || '',
      to: null,
      current: true,
    }]
    d.flags = []
    if (d.status === 'Valid') d.flags.push({ type: 'info', title: 'Registration current', detail: 'Status: Valid through ' + (d.registrationExpiry || 'N/A') })
    if (d.status !== 'Valid') d.flags.push({ type: 'warn', title: 'Registration: ' + d.status, detail: 'Status code: ' + (d.statusCode || 'N/A') })
    if (d.error) throw new Error(d.error)
    ctx.setLookup(d)
    result.value = d
    trackEvent('lookup_success', { source: 'spv' })
    if (isTwinFromLookup(d)) val.engines.value = '2'
  } catch (e) {
    console.log('N-number lookup failed:', e)
    errored.value = true
  }
  loading.value = false
}
</script>
