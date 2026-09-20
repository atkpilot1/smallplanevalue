<template>
  <div
    class="tab-pane"
    :class="{ active: activeTab === 'comps' }"
    role="tabpanel"
    id="pane-comps"
    data-testid="pane-comps"
    aria-labelledby="tab-btn-comps"
  >
    <p style="font-size:14px;color:var(--muted);line-height:1.6;margin-bottom:1rem">Enter a make/model to see typical asking price ranges. No fabricated sale prices — just what sellers are asking, plus negotiation guidance.</p>
    <div class="form-grid-2">
      <div class="form-group"><label for="c-model">MAKE &amp; MODEL</label><input type="text" id="c-model" placeholder="e.g. Cessna 172S, Van's RV-10" v-model="model" /></div>
      <div class="form-group">
        <label for="c-years">YEAR RANGE</label>
        <select id="c-years" v-model="years">
          <option>All years</option>
          <option>2015 – present</option>
          <option>2005 – 2014</option>
          <option>1995 – 2004</option>
          <option>1985 – 1994</option>
          <option>Pre-1985</option>
        </select>
      </div>
    </div>
    <button class="submit-btn" id="c-btn" :disabled="loading" @click="doComps">
      <i class="ti ti-search"></i> Search asking prices
    </button>
    <Spinner id="c-spin" :on="loading" message="Pulling active listing ranges..." />
    <div id="c-result" data-testid="comps-result">
      <CompsResult :v="result" :model="submittedModel" :failed="failed" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CompsResult } from '~/types/app'

const { activeTab } = useToolsTab()
const { model } = useCompsForm()
const years = ref('All years')
const loading = ref(false)
const result = ref<CompsResult | null>(null)
const failed = ref(false)
const submittedModel = ref('')

async function doComps() {
  const m = model.value.trim()
  if (!m) {
    alert('Enter a make and model.')
    return
  }
  loading.value = true
  result.value = null
  failed.value = false
  try {
    const v = await apiPost<CompsResult>('/api/comps', { model: m, years: years.value || '' })
    submittedModel.value = m
    result.value = v
  } catch {
    failed.value = true
  }
  loading.value = false
}
</script>
