<template>
  <div v-if="smoh > 0 && tbo">
    <div class="engine-life-label">
      <span><strong>{{ label }}</strong> {{ Number(smoh).toLocaleString() }} / {{ Number(tbo).toLocaleString() }} SMOH</span>
      <span><strong>{{ pct }}%</strong> life remaining ({{ hrsLeft.toLocaleString() }} hrs)</span>
    </div>
    <div class="engine-life-track">
      <div class="engine-life-fill" :class="fillClass" :style="{ width: pct + '%' }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string
  smoh: number
  tbo: number
  life?: {
    pctRemaining?: number
    pctUsed?: number
    hrsRemaining?: number
    status?: string
  } | null
}>()

const pct = computed(() =>
  props.life && props.life.pctRemaining != null
    ? props.life.pctRemaining
    : Math.max(0, Math.round((1 - props.smoh / props.tbo) * 100)),
)
const hrsLeft = computed(() =>
  props.life && props.life.hrsRemaining != null
    ? props.life.hrsRemaining
    : Math.max(0, props.tbo - props.smoh),
)
const status = computed(() =>
  props.life && props.life.status
    ? props.life.status
    : (pct.value >= 60 ? 'fresh' : pct.value >= 30 ? 'mid' : pct.value >= 10 ? 'high' : 'runout'),
)
const fillClass = computed(() => status.value === 'fresh' ? '' : status.value)
</script>
