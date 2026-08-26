<template>
  <div v-if="aircraft">
    <div style="background:var(--offwhite);border-radius:var(--radius);padding:12px 16px;margin-bottom:1rem;font-size:13px;color:var(--muted);line-height:1.6">
      <i class="ti ti-info-circle" style="font-size:14px;vertical-align:-2px;margin-right:4px"></i>
      <strong>This is a starting point for your pre-buy inspection.</strong> More in-depth checklists can be obtained from your A&amp;P mechanic and your aircraft's respective type club or pilot owners association (<a href="https://www.bonanza.org" target="_blank" style="color:var(--sky)">ABS</a>, <a href="https://www.cirruspilots.org" target="_blank" style="color:var(--sky)">COPA</a>, <a href="https://cessnaowner.org" target="_blank" style="color:var(--sky)">Cessna Owner Organization</a>, <a href="https://www.mmopa.com" target="_blank" style="color:var(--sky)">MMOPA</a>, <a href="https://www.piperowner.org" target="_blank" style="color:var(--sky)">POA</a>).
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin:1.5rem 0 .75rem;flex-wrap:wrap;gap:8px">
      <div style="font-size:16px;font-weight:500;color:var(--sky)">{{ aircraft }}</div>
      <div style="display:flex;align-items:center;gap:8px">
        <button @click="print" style="padding:6px 14px;font-size:13px;border:1px solid rgba(11,37,69,0.15);border-radius:6px;background:var(--offwhite);color:var(--sky);cursor:pointer;display:flex;align-items:center;gap:5px"><i class="ti ti-printer" style="font-size:15px"></i> Print</button>
        <div class="cl-stats" id="cl-stats-row">
          <span class="stat-pill" style="background:rgba(26,122,74,0.1);color:var(--success)"><i class="ti ti-check" style="font-size:12px"></i> {{ pass }}</span>
          <span class="stat-pill" style="background:rgba(232,160,32,0.12);color:var(--warn)"><i class="ti ti-flag" style="font-size:12px"></i> {{ flag }}</span>
          <span class="stat-pill" style="background:rgba(192,57,43,0.08);color:var(--danger)"><i class="ti ti-x" style="font-size:12px"></i> {{ fail }}</span>
          <span class="stat-pill" style="background:var(--offwhite);color:var(--muted)">{{ openCount }} left</span>
        </div>
      </div>
    </div>
    <div class="progress-bar">
      <div class="prog-fill" id="cl-prog" role="progressbar" aria-label="Checklist progress" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="String(pct)" :style="{ width: pct + '%' }"></div>
    </div>
    <div v-for="(sec, si) in sections" :key="si" class="cl-section" :id="'cls-' + si">
      <div class="cl-sec-hdr" @click="toggle(si)">
        <i class="ti" :class="clIcon(sec.name)" style="font-size:18px;color:var(--muted)"></i>
        <span class="cl-sec-name">{{ sec.name }}</span>
        <span class="cl-sec-count">{{ itemsFor(si).length }} items</span>
        <i class="ti ti-chevron-down cl-chev" :class="{ open: open[si] }" :id="'clch-' + si"></i>
      </div>
      <div class="cl-body" :id="'clb-' + si" :style="{ display: open[si] ? '' : 'none' }">
        <div v-for="item in itemsFor(si)" :key="item.id" class="cl-item" :id="'cli-' + item.id">
          <div class="cl-item-text">
            <div class="cl-item-name">{{ item.name }}<span v-if="item.critical" style="color:var(--danger);font-size:11px"> ▶ critical</span></div>
            <div class="cl-item-note">{{ item.note }}</div>
            <div v-if="item.critical && item.criticalReason" class="cl-item-crit"><i class="ti ti-alert-triangle" style="font-size:13px"></i>{{ item.criticalReason }}</div>
          </div>
          <div class="btn-grp">
            <button class="s-btn" :class="{ 's-pass': item.status === 'pass' }" @click="setStatus(item.id, 'pass')" title="Pass" aria-label="Pass"><i class="ti ti-check" style="font-size:13px" aria-hidden="true"></i></button>
            <button class="s-btn" :class="{ 's-flag': item.status === 'flag' }" @click="setStatus(item.id, 'flag')" title="Flag" aria-label="Flag"><i class="ti ti-flag" style="font-size:13px" aria-hidden="true"></i></button>
            <button class="s-btn" :class="{ 's-fail': item.status === 'fail' }" @click="setStatus(item.id, 'fail')" title="Fail" aria-label="Fail"><i class="ti ti-x" style="font-size:13px" aria-hidden="true"></i></button>
          </div>
        </div>
      </div>
    </div>
    <div id="cl-summary">
      <div class="result-card" style="margin-top:1.5rem">
        <div style="font-size:14px;font-weight:500;margin-bottom:1rem;display:flex;align-items:center;gap:8px" :style="{ color: verdictColor }">
          <i class="ti" :class="'ti-' + verdictIcon" style="font-size:18px"></i>{{ verdict }}
        </div>
        <div class="metric-row" style="grid-template-columns:repeat(4,1fr)">
          <div class="metric"><div class="metric-val" style="color:var(--success)">{{ pass }}</div><div class="metric-lbl">Passed</div></div>
          <div class="metric"><div class="metric-val" style="color:var(--warn)">{{ flag }}</div><div class="metric-lbl">Flagged</div></div>
          <div class="metric"><div class="metric-val" style="color:var(--danger)">{{ fail }}</div><div class="metric-lbl">Failed</div></div>
          <div class="metric"><div class="metric-val">{{ pct }}%</div><div class="metric-lbl">Complete</div></div>
        </div>
        <div v-if="flagged.length" style="margin-top:.75rem">
          <div style="font-size:12px;font-weight:500;color:var(--muted);margin-bottom:6px;letter-spacing:.04em">ITEMS NEEDING ATTENTION</div>
          <div v-for="i in flagged" :key="i.id" style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(11,37,69,0.06);font-size:13px;color:var(--sky)">
            <div style="width:8px;height:8px;border-radius:50%;flex-shrink:0" :style="{ background: i.status === 'fail' ? 'var(--danger)' : 'var(--warn)' }"></div>
            {{ i.name }}<span v-if="i.critical" style="font-size:11px;color:var(--danger)"> (critical)</span>
          </div>
        </div>
        <div class="note-box" style="margin-top:1rem">This checklist is a buyer guide, not a substitute for a certified pre-buy inspection by an independent A&amp;P mechanic.</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChecklistItem, ChecklistSection } from '~/types/app'
import { clIcon } from '~/data/checklistBase'

const props = defineProps<{
  aircraft: string
  sections: ChecklistSection[]
  items: ChecklistItem[]
}>()

const emit = defineEmits<{
  status: [id: number, s: 'pass' | 'flag' | 'fail']
}>()

const open = reactive<Record<number, boolean>>({})
watch(() => props.sections, (secs) => {
  secs.forEach((_, si) => { open[si] = true })
}, { immediate: true })

function itemsFor(si: number) {
  return props.items.filter((i) => i.si === si)
}

function toggle(si: number) {
  open[si] = !open[si]
}

function setStatus(id: number, s: 'pass' | 'flag' | 'fail') {
  emit('status', id, s)
}

function print() {
  window.print()
}

const pass = computed(() => props.items.filter((i) => i.status === 'pass').length)
const flag = computed(() => props.items.filter((i) => i.status === 'flag').length)
const fail = computed(() => props.items.filter((i) => i.status === 'fail').length)
const openCount = computed(() => props.items.filter((i) => i.status === 'open').length)
const pct = computed(() => {
  const total = props.items.length
  return total > 0 ? Math.round((total - openCount.value) / total * 100) : 0
})
const flagged = computed(() => props.items.filter((i) => i.status === 'flag' || i.status === 'fail'))
const verdict = computed(() =>
  fail.value > 0 ? 'Issues found — negotiate hard or walk away'
    : flag.value > 2 ? 'Concerns noted — get repair quotes before committing'
      : flag.value > 0 ? 'Minor concerns — use as negotiating points'
        : openCount.value > 0 ? 'Inspection in progress...'
          : 'Looking good — no major issues found',
)
const verdictColor = computed(() =>
  fail.value > 0 ? 'var(--danger)' : flag.value > 0 ? 'var(--warn)' : openCount.value > 0 ? 'var(--muted)' : 'var(--success)',
)
const verdictIcon = computed(() =>
  fail.value > 0 ? 'alert-circle' : flag.value > 0 ? 'alert-triangle' : openCount.value > 0 ? 'clock' : 'circle-check',
)
</script>
