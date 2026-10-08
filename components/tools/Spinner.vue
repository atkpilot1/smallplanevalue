<template>
  <div class="spin" :class="{ on }" :id="id">
    <template v-if="fly">
      <div class="fly-track"><span class="fly-plane"><i class="ti ti-plane"></i></span></div>
      <div>{{ message }}</div>
      <p v-if="tipHtml" class="partner-tip" id="v-partner-tip" v-html="tipHtml" @click="onPartnerClick"></p>
      <p v-else class="partner-tip" id="v-partner-tip"></p>
    </template>
    <template v-else>
      <div class="spin-i"><i class="ti ti-loader"></i></div>
      <div>{{ message }}</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { trackBrokerContact } from '~/composables/useAnalytics'

defineProps<{
  id: string
  on: boolean
  message: string
  fly?: boolean
  tipHtml?: string
}>()

function onPartnerClick(e: MouseEvent) {
  const link = (e.target as HTMLElement | null)?.closest('a')
  if (!link?.href) return
  trackBrokerContact(link.textContent?.trim() || link.href)
}
</script>
