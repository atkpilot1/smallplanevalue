<template>
  <div class="form-grid-2">
    <div class="form-group">
      <label for="v-paint">PAINT / EXTERIOR</label>
      <select id="v-paint" v-model="paint">
        <option v-for="opt in paintOptions" :key="opt" :value="opt">{{ opt }}</option>
      </select>
    </div>
    <div class="form-group">
      <label for="v-interior">INTERIOR</label>
      <select id="v-interior" v-model="interior">
        <option v-for="opt in interiorOptions" :key="opt" :value="opt">{{ opt }}</option>
      </select>
    </div>
  </div>

  <div class="form-grid-2">
    <div class="form-group">
      <label for="v-cond">OVERALL CONDITION</label>
      <select id="v-cond" v-model="cond">
        <option v-for="opt in overallOptions" :key="opt" :value="opt">{{ opt }}</option>
      </select>
    </div>
    <p class="cond-split-hint">
      Score paint and interior separately — e.g. original 1971 paint with a brand-new interior.
    </p>
  </div>

  <div class="form-grid-2">
    <div class="form-group">
      <label for="v-logbooks">LOGBOOKS</label>
      <select id="v-logbooks" v-model="logbooks">
        <option value="">Unknown</option>
        <option value="Complete since new">Complete since new (+value)</option>
        <option value="Complete, no gaps">Complete, no unexplained gaps</option>
        <option value="Minor gaps">Minor gaps</option>
        <option value="Missing / incomplete">Missing / incomplete (−value)</option>
      </select>
    </div>
    <div class="form-group">
      <label for="v-damage">DAMAGE HISTORY</label>
      <select id="v-damage" v-model="damage">
        <option value="">Unknown</option>
        <option value="None (clean, verified)">None — clean, verified</option>
        <option value="Repaired, minor (documented)">Repaired — minor, documented</option>
        <option value="Repaired, major (documented)">Repaired — major (spar/firewall/prop strike)</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  INTERIOR_CONDITION_OPTIONS,
  OVERALL_CONDITION_OPTIONS,
  PAINT_CONDITION_OPTIONS,
} from '~/utils/conditionOptions'

const val = useValuationForm()
const cond = val.cond
const paint = val.paint
const interior = val.interior
const logbooks = val.logbooks
const damage = val.damage

const overallOptions = OVERALL_CONDITION_OPTIONS
const paintOptions = PAINT_CONDITION_OPTIONS
const interiorOptions = INTERIOR_CONDITION_OPTIONS
</script>

<style scoped>
.cond-split-hint {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.45;
  margin: 0;
  padding-top: 22px;
}
</style>

