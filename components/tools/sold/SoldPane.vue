<template>
  <div
    class="tab-pane"
    :class="{ active: activeTab === 'sold' }"
    role="tabpanel"
    id="pane-sold"
    data-testid="pane-sold"
    aria-labelledby="tab-btn-sold"
  >
    <div style="background:rgba(232,160,32,0.08);border:1px solid rgba(232,160,32,0.2);border-radius:var(--radius-lg);padding:16px 20px;margin-bottom:1.5rem;display:flex;gap:14px;align-items:flex-start">
      <i class="ti ti-lock" style="font-size:20px;color:var(--accent);flex-shrink:0;margin-top:2px"></i>
      <div>
        <div style="font-size:14px;font-weight:500;color:var(--sky);margin-bottom:3px">Help build the database no one else has</div>
        <div style="font-size:13px;color:var(--muted);line-height:1.6">GA aircraft sale prices aren't recorded anywhere publicly. Every submission here — fully anonymous — helps build real transaction data that makes valuations more accurate for every buyer and seller.</div>
      </div>
    </div>

    <div style="font-size:12px;font-weight:500;color:var(--sky);margin-bottom:8px;letter-spacing:.03em">PASTE A SALE POST (optional)</div>
    <textarea id="sd-paste" rows="4" style="width:100%;font-size:13px;margin-bottom:8px" aria-label="Paste a sale post" placeholder="Paste a BeechTalk sold thread, forum recap, or listing text — we'll auto-fill the fields below..." v-model="paste"></textarea>
    <button class="n-lookup-btn" id="sd-paste-btn" :disabled="parseLoading" @click="parseSalePost" style="width:auto;padding:8px 20px;margin-bottom:1.25rem">Auto-fill from post</button>
    <Spinner id="sd-paste-spin" :on="parseLoading" message="Parsing sale post..." />

    <div class="form-grid-2">
      <div class="form-group"><label for="sd-make">AIRCRAFT MAKE</label><input type="text" id="sd-make" placeholder="Cessna, Piper, Beechcraft, Cirrus..." v-model="make" /></div>
      <div class="form-group"><label for="sd-model">MODEL</label><input type="text" id="sd-model" placeholder="172S, Cherokee 180, Bonanza A36..." v-model="model" /></div>
    </div>
    <div class="form-grid-3">
      <div class="form-group"><label for="sd-year">YEAR</label><input type="number" id="sd-year" placeholder="e.g. 1998" :value="year" @input="year = strInput($event)" /></div>
      <div class="form-group"><label for="sd-price">SALE PRICE ($)</label><input type="number" id="sd-price" placeholder="e.g. 135000" :value="price" @input="price = strInput($event)" /></div>
      <div class="form-group"><label for="sd-ask">ORIGINAL ASKING PRICE ($)</label><input type="number" id="sd-ask" placeholder="e.g. 159000" :value="ask" @input="ask = strInput($event)" /></div>
    </div>
    <div class="form-grid-3">
      <div class="form-group"><label>TOTAL TIME (TTAF)</label><input type="number" id="sd-ttaf" placeholder="e.g. 3200" :value="ttaf" @input="ttaf = strInput($event)" /></div>
      <div class="form-group"><label>ENGINE TIME (SMOH)</label><input type="number" id="sd-smoh" placeholder="e.g. 850" :value="smoh" @input="smoh = strInput($event)" /></div>
      <div class="form-group"><label>SALE DATE (approx)</label><input type="month" id="sd-date" v-model="saleDate" /></div>
    </div>
    <div class="form-grid-2">
      <div class="form-group">
        <label>REGION</label>
        <select id="sd-region" v-model="region">
          <option value="">Select region...</option>
          <option>Northeast US</option><option>Southeast US</option><option>Midwest US</option>
          <option>Southwest US</option><option>Northwest US</option><option>West Coast US</option>
          <option>Canada</option><option>Other / International</option>
        </select>
      </div>
      <div class="form-group">
        <label>AVIONICS TIER</label>
        <select id="sd-avionics" v-model="avionics">
          <option value="">Select tier...</option>
          <option>Steam gauges / basic VFR</option>
          <option>Basic IFR (one nav/com, no GPS)</option>
          <option>Mid panel (430/530 or equivalent)</option>
          <option>Modern IFR (GTN/Avidyne + ADS-B)</option>
          <option>Full glass (G1000, Avidyne Entegra)</option>
        </select>
      </div>
    </div>
    <div class="form-group" style="margin-bottom:12px">
      <label>CONDITION / NOTES (optional)</label>
      <textarea id="sd-notes" placeholder="Paint/interior condition, damage history, recent upgrades, engine type, prop info, anything that affected the price..." v-model="notes"></textarea>
    </div>
    <div class="form-grid-2">
      <div class="form-group">
        <label>YOUR ROLE</label>
        <select id="sd-role" v-model="role">
          <option>Buyer</option><option>Seller</option><option>Broker</option><option>Other / prefer not to say</option>
        </select>
      </div>
      <div class="form-group">
        <label>HOW LONG TO SELL?</label>
        <select id="sd-dom" v-model="dom">
          <option value="">Select...</option>
          <option>Under 30 days</option><option>1-3 months</option><option>3-6 months</option>
          <option>6-12 months</option><option>Over a year</option><option>Don't know</option>
        </select>
      </div>
    </div>

    <div style="margin:16px 0;display:flex;align-items:flex-start;gap:10px">
      <input type="checkbox" id="sd-agree" style="margin-top:3px;cursor:pointer" v-model="agreed" />
      <label for="sd-agree" style="font-size:13px;color:var(--muted);cursor:pointer;line-height:1.5">
        I confirm this is a real transaction I was involved in. I understand this data is anonymous and will be used to improve aircraft valuations for the GA community.
      </label>
    </div>

    <button class="submit-btn" id="sd-btn" :disabled="loading" @click="doSoldSubmit" style="background:var(--accent);border-color:var(--accent)">
      <i class="ti ti-send"></i> Submit sale data
    </button>
    <Spinner id="sd-spin" :on="loading" message="Submitting..." />
    <div id="sd-result" data-testid="sold-result">
      <SoldResult :entry="submitted" :error="error" :parsed="parsedOk" />
    </div>
    <div id="sd-recent" data-testid="sold-recent" style="margin-top:2rem">
      <SoldRecent v-if="showRecent" :entries="sold.entries.value" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ParsedSale, SoldEntry } from '~/types/app'
import { cleanPastedText } from '~/utils/format'

const { activeTab } = useToolsTab()
const sold = useSoldReports()
const paste = ref('')
const make = ref('')
const model = ref('')
const year = ref('')
const price = ref('')
const ask = ref('')
const ttaf = ref('')
const smoh = ref('')
const saleDate = ref('')
const region = ref('')
const avionics = ref('')
const notes = ref('')
const role = ref('Buyer')
const dom = ref('')
const agreed = ref(false)
const loading = ref(false)
const parseLoading = ref(false)
const submitted = ref<SoldEntry | null>(null)
const error = ref('')
const parsedOk = ref(false)
const showRecent = computed(() => activeTab.value === 'sold')

function strInput(e: Event) {
  return (e.target as HTMLInputElement).value
}

watch(activeTab, (id) => {
  if (id === 'sold') sold.load()
})

function matchSelectOption(options: string[], value: string) {
  if (!value) return ''
  const target = String(value).trim().toLowerCase()
  for (const text of options) {
    const t = text.trim().toLowerCase()
    if (t === target || t.indexOf(target) >= 0 || target.indexOf(t) >= 0) return text
  }
  return ''
}

function inferAvionicsTier(list: string[] | null | undefined) {
  if (!list || !list.length) return ''
  const s = list.join(' ').toUpperCase()
  if (/G1000|G3X|G500 TXI|G600 TXI|ENTEGRA|AVIDYNE R9|DYNON HDX|SKYVIEW HDX/.test(s)) {
    return 'Full glass (G1000, Avidyne Entegra)'
  }
  if (/GTN|GNS430W|GNS530W|IFD ?5|GTX ?3|ADS-?B/.test(s)) {
    return 'Modern IFR (GTN/Avidyne + ADS-B)'
  }
  if (/GNS ?4|GNS ?5|430W|530W|430\/530/.test(s)) {
    return 'Mid panel (430/530 or equivalent)'
  }
  if (/NAV\/COM|KX155|IFR/.test(s)) {
    return 'Basic IFR (one nav/com, no GPS)'
  }
  return 'Steam gauges / basic VFR'
}

async function parseSalePost() {
  const txt = cleanPastedText(paste.value)
  if (!txt) {
    alert('Paste a sale post first.')
    return
  }
  parseLoading.value = true
  parsedOk.value = false
  error.value = ''
  try {
    const d = await apiPost<ParsedSale>('/api/parse-sale', { text: txt.substring(0, 5000) })
    if (d.make) make.value = d.make
    if (d.model) model.value = d.model
    if (d.year) year.value = String(d.year)
    if (d.salePrice) price.value = String(d.salePrice)
    if (d.askingPrice) ask.value = String(d.askingPrice)
    if (d.ttaf) ttaf.value = String(d.ttaf)
    if (d.smoh) smoh.value = String(d.smoh)
    if (d.saleMonth) saleDate.value = d.saleMonth
    const regionMatch = matchSelectOption(
      ['Northeast US', 'Southeast US', 'Midwest US', 'Southwest US', 'Northwest US', 'West Coast US', 'Canada', 'Other / International'],
      d.region || '',
    )
    if (regionMatch) region.value = regionMatch
    const tier = d.avionicsTier || inferAvionicsTier(d.avionics)
    const tierMatch = matchSelectOption(
      ['Steam gauges / basic VFR', 'Basic IFR (one nav/com, no GPS)', 'Mid panel (430/530 or equivalent)', 'Modern IFR (GTN/Avidyne + ADS-B)', 'Full glass (G1000, Avidyne Entegra)'],
      tier,
    )
    if (tierMatch) avionics.value = tierMatch
    const domMatch = matchSelectOption(
      ['Under 30 days', '1-3 months', '3-6 months', '6-12 months', 'Over a year', "Don't know"],
      d.daysOnMarket || '',
    )
    if (domMatch) dom.value = domMatch
    if (d.notes) notes.value = (d.notes || '').substring(0, 500)
    parsedOk.value = true
    submitted.value = null
  } catch (e) {
    console.error('Sale parse failed:', e)
    alert('Could not parse sale post. Try entering details manually.')
  }
  parseLoading.value = false
}

function doSoldSubmit() {
  const mk = String(make.value ?? '').trim()
  const md = String(model.value ?? '').trim()
  const yr = String(year.value ?? '').trim()
  const pr = String(price.value ?? '').trim()
  if (!mk || !md || !yr || !pr) {
    error.value = 'Please fill in at least make, model, year, and sale price.'
    parsedOk.value = false
    submitted.value = null
    return
  }
  if (!agreed.value) {
    error.value = 'Please check the confirmation box before submitting.'
    parsedOk.value = false
    submitted.value = null
    return
  }

  loading.value = true
  error.value = ''
  parsedOk.value = false
  setTimeout(() => {
    const entry: SoldEntry = {
      id: Date.now(),
      make: mk,
      model: md,
      year: parseInt(yr, 10),
      price: parseInt(pr, 10),
      ask: ask.value ? parseInt(String(ask.value), 10) : null,
      ttaf: ttaf.value ? parseInt(String(ttaf.value), 10) : null,
      smoh: smoh.value ? parseInt(String(smoh.value), 10) : null,
      saleDate: saleDate.value || null,
      region: region.value || null,
      avionics: avionics.value || null,
      notes: notes.value.trim() || null,
      role: role.value,
      dom: dom.value || null,
      ts: new Date().toISOString(),
    }
    sold.add(entry)
    submitted.value = entry
    make.value = ''
    model.value = ''
    year.value = ''
    price.value = ''
    ask.value = ''
    ttaf.value = ''
    smoh.value = ''
    notes.value = ''
    saleDate.value = ''
    region.value = ''
    avionics.value = ''
    dom.value = ''
    agreed.value = false
    loading.value = false
  }, 600)
}
</script>
