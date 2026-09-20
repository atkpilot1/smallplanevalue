<template>
  <details class="adv-section">
    <summary>AVIONICS — itemize for precision <span class="adv-hint">optional — overrides panel above</span></summary>
    <div class="adv-body">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px 24px">
        <div v-for="(col, ci) in AVIONICS_COLUMNS" :key="ci">
          <template v-for="(group, gi) in col" :key="gi">
            <div
              class="av-hdr"
              :class="{ open: open[ci + '-' + gi] }"
              @click="open[ci + '-' + gi] = !open[ci + '-' + gi]"
              style="font-size:11px;font-weight:600;color:var(--sky);letter-spacing:.04em"
            >
              <span class="arrow">▶</span> {{ group.title }}
            </div>
            <div class="av-body" :style="{ flexDirection: 'column', gap: group.gap || '3px', marginBottom: '12px' }">
              <label
                v-for="item in group.items"
                :key="item.id"
                class="chk-label"
                :style="item.qtyOptions || item.sizeOptions ? { display: 'flex', alignItems: 'center', gap: '6px' } : undefined"
              >
                <input type="checkbox" :id="item.id" v-model="avChecked[item.id]" /> {{ item.label }}
                <select
                  v-if="item.qtyOptions"
                  :id="item.id + '-qty'"
                  v-model="avQty[item.id]"
                  style="width:42px;padding:1px 2px;font-size:11px;border:1px solid #555;border-radius:3px;background:#f0f4f8;color:#1a2332;border-color:#aab"
                >
                  <option v-for="q in item.qtyOptions" :key="q" :value="q">x{{ q }}</option>
                </select>
                <select
                  v-if="item.sizeOptions"
                  :id="item.id + '-size'"
                  v-model="avSize[item.id]"
                  style="width:62px;padding:1px 2px;font-size:11px;border:1px solid #aab;border-radius:3px;background:#f0f4f8;color:#1a2332"
                >
                  <option v-for="s in item.sizeOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
                </select>
              </label>
            </div>
          </template>
        </div>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import { AVIONICS_COLUMNS } from '~/data/avionicsCatalog'

const val = useValuationForm()
const avChecked = val.avChecked
const avQty = val.avQty
const avSize = val.avSize

const open = reactive<Record<string, boolean>>({})
AVIONICS_COLUMNS.forEach((col, ci) => {
  col.forEach((_, gi) => {
    open[ci + '-' + gi] = true
  })
})
</script>
