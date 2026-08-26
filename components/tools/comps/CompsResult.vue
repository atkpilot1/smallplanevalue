<template>
  <p v-if="failed" style="color:var(--danger);font-size:14px;margin-top:1rem">Failed. Please try again.</p>
  <div v-else-if="v" class="result-card">
    <div style="font-weight:500;font-size:16px;color:var(--sky);margin-bottom:1rem">{{ model }} — active listings</div>
    <div class="metric-row" style="grid-template-columns:repeat(4,1fr)">
      <div class="metric"><div class="metric-val">{{ fmt(v.askLow || 0) }}</div><div class="metric-lbl">Low ask</div></div>
      <div class="metric"><div class="metric-val">{{ fmt(v.askMid || 0) }}</div><div class="metric-lbl">Median ask</div></div>
      <div class="metric"><div class="metric-val">{{ fmt(v.askHigh || 0) }}</div><div class="metric-lbl">High ask</div></div>
      <div class="metric"><div class="metric-val">{{ v.avgDaysListed }}d</div><div class="metric-lbl">Avg listed</div></div>
    </div>
    <p style="font-size:14px;color:rgba(11,37,69,0.7);margin-bottom:.75rem">{{ v.summary }}</p>
    <div style="font-size:13px;color:var(--muted);padding:10px 12px;background:var(--offwhite);border-radius:var(--radius);margin-bottom:1rem">
      <i class="ti ti-info-circle" style="font-size:14px;vertical-align:-2px;margin-right:4px"></i>{{ v.negotiationNote }}
    </div>
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="border-bottom:1px solid rgba(11,37,69,0.1)">
            <th style="text-align:left;padding:8px 10px;font-size:11px;font-weight:500;color:var(--muted);letter-spacing:.04em">YEAR</th>
            <th style="text-align:left;padding:8px 10px;font-size:11px;font-weight:500;color:var(--muted);letter-spacing:.04em">TTAF</th>
            <th style="text-align:left;padding:8px 10px;font-size:11px;font-weight:500;color:var(--muted);letter-spacing:.04em">SMOH</th>
            <th style="text-align:left;padding:8px 10px;font-size:11px;font-weight:500;color:var(--muted);letter-spacing:.04em">COND.</th>
            <th style="text-align:left;padding:8px 10px;font-size:11px;font-weight:500;color:var(--muted);letter-spacing:.04em">ASKING PRICE</th>
            <th style="text-align:left;padding:8px 10px;font-size:11px;font-weight:500;color:var(--muted);letter-spacing:.04em">LISTED</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(l, i) in v.listings || []" :key="i" style="border-bottom:1px solid rgba(11,37,69,0.06)">
            <td style="padding:8px 10px;font-size:13px;color:var(--sky)">{{ l.year }}</td>
            <td style="padding:8px 10px;font-size:13px;color:var(--sky)">{{ l.ttaf ? l.ttaf.toLocaleString() + ' h' : '—' }}</td>
            <td style="padding:8px 10px;font-size:13px;color:var(--sky)">{{ l.smoh ? l.smoh.toLocaleString() + ' h' : '—' }}</td>
            <td style="padding:8px 10px;font-size:13px;color:var(--sky)">{{ l.cond }}</td>
            <td style="padding:8px 10px;font-size:13px;font-weight:500;color:var(--sky)">
              <span v-if="l.ask">{{ fmt(l.ask) }}</span>
              <span v-else style="color:var(--accent);font-style:italic">Call for price</span>
            </td>
            <td style="padding:8px 10px"><span class="badge" :class="l.daysListed < 30 ? 'bg-green' : 'bg-amber'">{{ l.daysListed }}d</span></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="note-box" style="margin-top:.75rem">Asking prices only — no sale prices, as GA transactions are not publicly recorded. Verify at <a href="https://www.trade-a-plane.com" target="_blank" style="color:var(--sky-light)">Trade-A-Plane</a>, <a href="https://www.controller.com" target="_blank" style="color:var(--sky-light)">Controller.com</a>, <a href="https://www.barnstormers.com" target="_blank" style="color:var(--sky-light)">Barnstormers</a>.</div>
  </div>
</template>

<script setup lang="ts">
import type { CompsResult } from '~/types/app'
import { fmt } from '~/utils/format'

defineProps<{
  v: CompsResult | null
  model: string
  failed: boolean
}>()
</script>
