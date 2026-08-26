<template>
  <div
    class="tab-pane"
    :class="{ active: activeTab === 'checklist' }"
    role="tabpanel"
    id="pane-checklist"
    data-testid="pane-checklist"
    aria-labelledby="tab-btn-checklist"
  >
    <div class="form-grid-2">
      <div class="form-group"><label for="cl-make">MAKE</label><input type="text" id="cl-make" placeholder="Cessna, Piper, Van's..." v-model="make" /></div>
      <div class="form-group"><label for="cl-model">MODEL</label><input type="text" id="cl-model" placeholder="172S, RV-10, SR22..." v-model="model" /></div>
    </div>
    <div class="form-grid-3">
      <div class="form-group"><label for="cl-year">YEAR</label><input type="number" id="cl-year" placeholder="e.g. 2003" :value="year" @input="year = strInput($event)" /></div>
      <div class="form-group">
        <label>ENGINE TYPE</label>
        <select id="cl-eng" v-model="eng">
          <option>Lycoming</option>
          <option>Continental</option>
          <option>Rotax (LSA)</option>
          <option>Turboprop</option>
          <option>Other / unknown</option>
        </select>
      </div>
      <div class="form-group">
        <label>BUYER EXPERIENCE</label>
        <select id="cl-exp" v-model="exp">
          <option>First-time buyer</option>
          <option>Some experience</option>
          <option>Experienced buyer</option>
        </select>
      </div>
    </div>
    <div class="form-grid-2">
      <div class="form-group"><label>KNOWN CONCERNS (optional)</label><input type="text" id="cl-concerns" placeholder="damage history, high time engine..." v-model="concerns" /></div>
      <div class="form-group">
        <label>PURPOSE</label>
        <select id="cl-purpose" v-model="purpose">
          <option>Personal flying / training</option>
          <option>IFR / instrument flying</option>
          <option>Commercial / charter use</option>
          <option>Financing / lender required</option>
        </select>
      </div>
    </div>
    <button class="submit-btn" id="cl-btn" :disabled="loading" @click="doChecklist">
      <i class="ti ti-clipboard-list"></i> Generate inspection checklist
    </button>
    <Spinner id="cl-spin" :on="loading" message="Building your aircraft-specific checklist..." />
    <div id="cl-result" data-testid="checklist-result">
      <ChecklistResult :aircraft="aircraft" :sections="sections" :items="items" @status="onStatus" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChecklistItem, ChecklistSection } from '~/types/app'
import { buildChecklistBase, isMultiAircraft, isRetractAircraft, RETRACT_ITEMS, TWIN_ITEMS } from '~/data/checklistBase'

const { activeTab } = useToolsTab()
const ctx = useAircraftContext()
const form = useChecklistForm()
const make = form.make
const model = form.model
const year = form.year
const eng = form.eng
const exp = ref('First-time buyer')
const concerns = ref('')
const purpose = ref('Personal flying / training')
const loading = ref(false)
const aircraft = ref('')
const sections = ref<ChecklistSection[]>([])
const items = ref<ChecklistItem[]>([])

function strInput(e: Event) {
  return (e.target as HTMLInputElement).value
}

watch(() => form.resultToken.value, () => {
  aircraft.value = ''
  sections.value = []
  items.value = []
})

function flatten(secs: ChecklistSection[]) {
  const out: ChecklistItem[] = []
  let id = 0
  secs.forEach((sec, si) => {
    sec.items.forEach((item) => {
      out.push({ ...item, id: id++, si, status: 'open' })
    })
  })
  return out
}

async function doChecklist() {
  const mk = String(make.value ?? '').trim()
  const md = String(model.value ?? '').trim()
  if (!mk || !md) {
    alert('Enter make and model.')
    return
  }
  loading.value = true
  aircraft.value = ''
  sections.value = []
  items.value = []

  const isRetract = isRetractAircraft(String(ctx.acType.value || ''), md)
  const isMulti = isMultiAircraft(ctx.numEng.value, String(ctx.acType.value || ''), md)
  const base = buildChecklistBase()
  if (isRetract) {
    const gearIdx = base.findIndex((s) => s.name === 'Landing Gear')
    base[gearIdx].items.push(...RETRACT_ITEMS)
  }
  if (isMulti) {
    const flightIdx = base.findIndex((s) => s.name === 'Flight Check')
    base[flightIdx].items.push(...TWIN_ITEMS)
  }

  try {
    const specific = await apiPost<Array<{ name: string; note: string; critical?: boolean }>>('/api/checklist', {
      make: mk,
      model: md,
      year: String(year.value || ''),
      eng: eng.value || '',
      engModel: ctx.engModel.value || '',
      acType: ctx.acType.value || '',
      numEng: String(ctx.numEng.value || ''),
      exp: exp.value || '',
      concerns: concerns.value || '',
      purpose: purpose.value || '',
    })
    const specItems = Array.isArray(specific) ? specific : [specific]
    base.push({ name: mk + ' ' + md + ' Specific Items', items: specItems })
  } catch {
    console.log('Model-specific items failed, using base checklist')
  }

  const ac = (year.value || '') + ' ' + mk + ' ' + md
  aircraft.value = ac.trim()
  sections.value = base
  items.value = flatten(base)
  loading.value = false
}

function onStatus(id: number, s: 'pass' | 'flag' | 'fail') {
  const item = items.value.find((i) => i.id === id)
  if (!item) return
  item.status = item.status === s ? 'open' : s
}
</script>
