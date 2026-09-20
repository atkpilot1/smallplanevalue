<template>
  <div class="aircraft-card">
    <img :src="plane.img" :alt="plane.alt" loading="lazy">
    <div class="aircraft-card-overlay">
      <div class="aircraft-tag"><i class="ti" :class="plane.icon" style="font-size:11px"></i> {{ plane.tag }}</div>
      <div class="aircraft-name">{{ plane.name }}</div>
      <div class="aircraft-desc">{{ plane.desc }}</div>
    </div>
    <div class="aircraft-val-badge">Typical ask: <span>{{ plane.ask }}</span></div>
  </div>
</template>

<script setup lang="ts">
import type { ShowcasePlane } from '~/utils/showcase'

defineProps<{ plane: ShowcasePlane }>()
</script>
