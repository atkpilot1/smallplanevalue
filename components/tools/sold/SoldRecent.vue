<template>
  <div v-if="entries.length === 0" style="text-align:center;padding:2rem 1rem;color:var(--muted)">
    <i class="ti ti-database" style="font-size:32px;display:block;margin-bottom:8px;opacity:0.4"></i>
    <div style="font-size:14px;font-weight:500;margin-bottom:4px">No sales reported yet</div>
    <div style="font-size:13px">Be the first to contribute. Your data stays anonymous.</div>
  </div>
  <template v-else>
    <div style="font-size:12px;font-weight:500;color:var(--muted);letter-spacing:.04em;margin-bottom:12px;display:flex;align-items:center;gap:8px">
      <i class="ti ti-database" style="font-size:14px"></i> RECENT COMMUNITY SUBMISSIONS ({{ entries.length }})
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <div
        v-for="s in entries.slice(0, 10)"
        :key="s.id"
        style="background:var(--card-bg);border:1px solid var(--card-border);border-radius:var(--radius);padding:14px 16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"
      >
        <div>
          <div style="font-size:14px;font-weight:500;color:var(--sky)">{{ s.year }} {{ s.make }} {{ s.model }}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">
            <template v-if="s.ttaf">{{ s.ttaf.toLocaleString() }} TT</template>
            <template v-if="s.ttaf && s.smoh"> · </template>
            <template v-if="s.smoh">{{ s.smoh.toLocaleString() }} SMOH</template>
            <template v-if="(s.ttaf || s.smoh) && s.region"> · </template>
            {{ s.region || '' }}
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:15px;font-weight:500;font-family:var(--mono);color:var(--sky)">${{ s.price.toLocaleString() }}</div>
          <div style="font-size:12px;color:var(--muted)">
            <span v-if="discount(s) !== null" :style="{ color: discount(s)! > 0 ? 'var(--success)' : 'var(--danger)' }">{{ discount(s)! > 0 ? '▼' : '▲' }}{{ Math.abs(discount(s)!) }}% vs ask</span>
            <template v-if="discount(s) !== null && dateStr(s)"> · </template>
            {{ dateStr(s) }}
          </div>
        </div>
      </div>
    </div>
    <div v-if="entries.length > 10" style="text-align:center;font-size:12px;color:var(--muted);margin-top:8px">Showing 10 of {{ entries.length }} submissions</div>
  </template>
</template>

<script setup lang="ts">
import type { SoldEntry } from '~/types/app'

defineProps<{ entries: SoldEntry[] }>()

function discount(s: SoldEntry) {
  return s.ask ? Math.round((1 - s.price / s.ask) * 100) : null
}

function dateStr(s: SoldEntry) {
  return s.saleDate ? s.saleDate : (s.ts ? new Date(s.ts).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '')
}
</script>
