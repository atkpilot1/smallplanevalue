<template>
  <div v-if="error" class="note-box" style="border-color:var(--danger);background:rgba(192,57,43,0.06);margin-top:1rem">
    <i class="ti ti-alert-circle" style="color:var(--danger);font-size:14px"></i> {{ error }}
  </div>
  <div v-else-if="parsed" class="note-box" style="margin-top:1rem">
    <i class="ti ti-circle-check" style="color:var(--success);font-size:14px"></i> Fields filled from post — review and submit when ready.
  </div>
  <div v-else-if="entry" class="result-card" style="margin-top:1.5rem">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:1rem">
      <i class="ti ti-circle-check" style="font-size:22px;color:var(--success)"></i>
      <div style="font-size:15px;font-weight:500;color:var(--success)">Sale data submitted — thank you!</div>
    </div>
    <div class="metric-row" :style="{ gridTemplateColumns: 'repeat(' + (discount !== null ? 3 : 2) + ',1fr)' }">
      <div class="metric"><div class="metric-val" style="font-family:var(--mono)">${{ entry.price.toLocaleString() }}</div><div class="metric-lbl">Sale price</div></div>
      <div v-if="entry.ask" class="metric"><div class="metric-val" style="font-family:var(--mono)">${{ entry.ask.toLocaleString() }}</div><div class="metric-lbl">Asking price</div></div>
      <div v-if="discount !== null" class="metric">
        <div class="metric-val" :style="{ color: discount > 0 ? 'var(--success)' : 'var(--danger)' }">{{ discount > 0 ? '-' : '+' }}{{ Math.abs(discount) }}%</div>
        <div class="metric-lbl">vs. asking</div>
      </div>
    </div>
    <div class="note-box" style="margin-top:1rem">
      <div style="font-size:13px;color:var(--sky)">
        <strong>{{ entry.year }} {{ entry.make }} {{ entry.model }}</strong>
        <template v-if="entry.ttaf"> · {{ entry.ttaf.toLocaleString() }} TT</template>
        <template v-if="entry.smoh"> · {{ entry.smoh.toLocaleString() }} SMOH</template>
        <template v-if="entry.region"> · {{ entry.region }}</template>
      </div>
    </div>
    <div style="margin-top:1rem;font-size:13px;color:var(--muted);line-height:1.6">
      As SmallPlaneValue grows, submissions like yours will feed into real discount band calculations — making this tool more accurate for every GA buyer and seller.
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SoldEntry } from '~/types/app'

const props = defineProps<{
  entry: SoldEntry | null
  error: string
  parsed: boolean
}>()

const discount = computed(() =>
  props.entry?.ask ? Math.round((1 - props.entry.price / props.entry.ask) * 100) : null,
)
</script>
