<template>
  <div class="showcase">
    <div class="showcase-grid">
      <ShowcaseCard v-for="plane in planes" :key="plane.name" :plane="plane" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ShowcasePlane } from '~/utils/showcase'

defineProps<{ planes: ShowcasePlane[] }>()
</script>
