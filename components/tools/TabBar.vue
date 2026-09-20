<template>
  <div class="tab-bar" role="tablist" aria-label="Tools">
    <button
      class="tab-btn"
      :class="{ active: activeTab === 'lookup' }"
      role="tab"
      id="tab-btn-lookup"
      :aria-selected="activeTab === 'lookup'"
      aria-controls="pane-lookup"
      @click="onTab('lookup')"
    >
      <i class="ti ti-id" aria-hidden="true"></i> N-number lookup
    </button>
    <button
      class="tab-btn highlight"
      :class="{ active: activeTab === 'val' }"
      role="tab"
      id="tab-btn-val"
      :aria-selected="activeTab === 'val'"
      aria-controls="pane-val"
      @click="onValTab"
    >
      <i class="ti ti-calculator" aria-hidden="true"></i> Get valuation
    </button>
    <button
      class="tab-btn"
      :class="{ active: activeTab === 'comps' }"
      role="tab"
      id="tab-btn-comps"
      :aria-selected="activeTab === 'comps'"
      aria-controls="pane-comps"
      @click="onCompsTab"
    >
      <i class="ti ti-search" aria-hidden="true"></i> Market listings
    </button>
    <button
      class="tab-btn"
      :class="{ active: activeTab === 'checklist' }"
      role="tab"
      id="tab-btn-checklist"
      :aria-selected="activeTab === 'checklist'"
      aria-controls="pane-checklist"
      @click="onChecklistTab"
    >
      <i class="ti ti-clipboard-check" aria-hidden="true"></i> Pre-buy checklist
    </button>
    <button
      class="tab-btn highlight"
      :class="{ active: activeTab === 'sold' }"
      role="tab"
      id="tab-btn-sold"
      :aria-selected="activeTab === 'sold'"
      aria-controls="pane-sold"
      @click="onTab('sold')"
    >
      <i class="ti ti-currency-dollar" aria-hidden="true"></i> Report a sale
    </button>
    <button
      class="tab-btn"
      :class="{ active: activeTab === 'feedback' }"
      role="tab"
      id="tab-btn-feedback"
      :aria-selected="activeTab === 'feedback'"
      aria-controls="pane-feedback"
      style="font-weight:600"
      @click="onTab('feedback')"
    >
      <i class="ti ti-message-circle" aria-hidden="true"></i> Feedback
    </button>
  </div>
</template>

<script setup lang="ts">
const { activeTab, switchTab } = useToolsTab()
const ctx = useAircraftContext()
const val = useValuationForm()
const comps = useCompsForm()
const checklist = useChecklistForm()

function onTab(id: 'lookup' | 'val' | 'comps' | 'checklist' | 'sold' | 'feedback') {
  switchTab(id)
}

function onValTab() {
  if (ctx.lastLookup.value) val.prefillFromLookup(ctx.lastLookup.value)
  switchTab('val')
}

function onCompsTab() {
  if (ctx.lastLookup.value) comps.prefillFromLookup(ctx.lastLookup.value)
  switchTab('comps')
}

function onChecklistTab() {
  if (ctx.lastLookup.value) checklist.prefillFromLookup(ctx.lastLookup.value)
  switchTab('checklist')
}
</script>
