<template>
  <div class="spin" :class="{ on }" :id="id">
    <template v-if="fly">
      <div class="fly-track"><span class="fly-plane"><i class="ti ti-plane"></i></span></div>
      <div>{{ message }}</div>
      <p v-if="tipHtml" class="partner-tip" id="v-partner-tip" v-html="tipHtml"></p>
      <p v-else class="partner-tip" id="v-partner-tip"></p>
    </template>
    <template v-else>
      <div class="spin-i"><i class="ti ti-loader"></i></div>
      <div>{{ message }}</div>
    </template>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  id: string
  on: boolean
  message: string
  fly?: boolean
  tipHtml?: string
}>()
</script>
