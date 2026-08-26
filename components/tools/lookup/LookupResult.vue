<template>
  <div v-if="notFound" class="note-box" style="border-color:var(--warn);background:rgba(230,160,0,0.06);margin-top:1rem">
    <i class="ti ti-plane-off" style="color:var(--warn);font-size:14px"></i> No aircraft found for N{{ raw }}. Check the number and try again, or <a :href="'https://registry.faa.gov/AircraftInquiry/Search/NNumberResult?nNumberTxt=' + raw" target="_blank" style="color:var(--sky-light)">search FAA directly</a>.
  </div>
  <div v-else-if="error" class="note-box" style="border-color:var(--danger);background:rgba(192,57,43,0.06);margin-top:1rem">
    <i class="ti ti-alert-circle" style="color:var(--danger);font-size:14px"></i> Could not retrieve FAA data for N{{ raw }}. <a :href="'https://registry.faa.gov/AircraftInquiry/Search/NNumberResult?nNumberTxt=' + raw" target="_blank" style="color:var(--sky-light)">Check FAA directly →</a>
  </div>
  <template v-else-if="d">
    <div class="reg-card">
      <div class="reg-hdr">
        <div>
          <div class="reg-aircraft-name">{{ d.year }} {{ d.make }} {{ d.model }}</div>
          <div class="reg-n-tag">{{ d.nnumber }} · S/N {{ d.serialNumber || '—' }}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
          <span class="badge bg-green"><i class="ti ti-circle-check" style="font-size:12px"></i> {{ d.status || 'Valid' }}</span>
          <span class="badge bg-blue">{{ d.aircraftType || 'Fixed wing' }}</span>
        </div>
      </div>
      <div class="reg-grid">
        <div class="reg-cell"><div class="reg-lbl">Engine</div><div class="reg-val">{{ d.engineMake || 'N/A' }} {{ d.engineModel || '' }}</div></div>
        <div class="reg-cell"><div class="reg-lbl">Seats</div><div class="reg-val">{{ d.seats || '—' }}</div></div>
        <div class="reg-cell"><div class="reg-lbl">Airworthiness</div><div class="reg-val">{{ d.airworthinessCert || 'Standard' }} · {{ fmtDate(d.certDate) }}</div></div>
        <div class="reg-cell"><div class="reg-lbl">Reg. expiry</div><div class="reg-val">{{ fmtDate(d.registrationExpiry) }}</div></div>
        <div class="reg-cell"><div class="reg-lbl">Registrant</div><div class="reg-val">{{ d.registrantName }}</div></div>
        <div class="reg-cell"><div class="reg-lbl">Location</div><div class="reg-val">{{ d.city }}, {{ d.state }}</div></div>
      </div>
    </div>
    <div v-if="d.flags?.length" class="reg-card">
      <div v-for="(f, i) in d.flags" :key="i" class="flag-row">
        <i
          class="ti flag-row-icon"
          :class="f.type === 'danger' ? 'ti-alert-circle' : f.type === 'warn' ? 'ti-alert-triangle' : 'ti-info-circle'"
          :style="{ color: f.type === 'danger' ? 'var(--danger)' : f.type === 'warn' ? 'var(--warn)' : 'var(--sky-light)' }"
        ></i>
        <div class="flag-txt">{{ f.title }}<div class="flag-sub">{{ f.detail }}</div></div>
      </div>
    </div>
    <div class="reg-card">
      <div style="padding:12px 18px;border-bottom:1px solid rgba(11,37,69,0.08);font-size:12px;font-weight:500;color:var(--muted);display:flex;align-items:center;gap:8px">
        <i class="ti ti-users" style="font-size:15px"></i> Ownership history · {{ (d.ownerHistory || []).length }} owner{{ (d.ownerHistory || []).length === 1 ? '' : 's' }}
      </div>
      <div v-for="(o, i) in d.ownerHistory" :key="i" class="owner-row">
        <div class="owner-dot" :class="{ cur: o.current }"></div>
        <div style="flex:1">
          <div class="owner-name">{{ o.name }}</div>
          <div class="owner-dates">{{ fmtDate(o.from) }} → {{ o.current ? 'present' : fmtDate(o.to) }}</div>
        </div>
        <div style="text-align:right;font-size:12px;color:var(--muted)">{{ o.city }}, {{ o.state }}</div>
      </div>
    </div>
    <div v-if="d.adNotes" style="background:rgba(232,160,32,0.1);border-radius:var(--radius);padding:10px 14px;margin-bottom:1rem;display:flex;gap:10px;align-items:flex-start">
      <i class="ti ti-tool" style="font-size:16px;color:var(--warn);flex-shrink:0"></i>
      <div style="font-size:13px;color:var(--sky)"><strong>ADs to verify:</strong> {{ d.adNotes }}</div>
    </div>
    <div class="action-row-3">
      <button class="action-btn" @click="goVal"><i class="ti ti-calculator" style="font-size:15px"></i> Get valuation</button>
      <button class="action-btn" @click="goChecklist"><i class="ti ti-clipboard-check" style="font-size:15px"></i> Pre-buy checklist</button>
      <button class="action-btn" @click="openFaa"><i class="ti ti-external-link" style="font-size:15px"></i> FAA website</button>
    </div>
    <div class="note-box" style="margin-top:.75rem">Data sourced from FAA aircraft registry (registry.faa.gov). Owner names are public FAA records.</div>
  </template>
</template>

<script setup lang="ts">
import type { LookupRecord } from '~/types/app'
import { fmtDate } from '~/utils/format'

const props = defineProps<{
  d: LookupRecord | null
  notFound: boolean
  error: boolean
  raw: string
}>()

const { switchTab } = useToolsTab()
const val = useValuationForm()
const checklist = useChecklistForm()

function goVal() {
  if (!props.d) return
  val.prefillFromLookup(props.d)
  switchTab('val')
}

function goChecklist() {
  if (!props.d) return
  checklist.prefillFromLookup(props.d)
  switchTab('checklist')
}

function openFaa() {
  if (!props.d) return
  window.open('https://registry.faa.gov/aircraftinquiry/Search/NNumberInquiry?nNumberTxt=' + String(props.d.nnumber).replace(/^N/, ''), '_blank')
}
</script>
