<template>
  <div v-if="summary" class="for-sale-note" :data-testid="testId || null">
    <template v-if="summary.count > 0">
      <strong>{{ summary.count.toLocaleString('en-US') }}</strong>
      {{ summary.label }} {{ summary.count === 1 ? 'is' : 'are' }} for sale in our Trade-A-Plane catalog.
      <template v-if="summary.sameYearCount">
        {{ summary.sameYearCount.toLocaleString('en-US') }}
        {{ summary.sameYearCount === 1 ? 'is' : 'are' }} listed as {{ year }}.
      </template>
      <span v-if="meta" class="for-sale-meta">{{ meta }}</span>
    </template>
    <template v-else>
      None like this {{ summary.label }} are for sale in our Trade-A-Plane catalog.
      <span v-if="summary.syncedAtLabel" class="for-sale-meta">Catalog as of {{ summary.syncedAtLabel }}.</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ForSaleCount } from '~/types/app'

const props = defineProps<{
  summary: ForSaleCount | null
  year?: string
  testId?: string
}>()

const meta = computed(() => {
  const summary = props.summary
  if (!summary || summary.count < 1) return ''
  const parts: string[] = []
  if (summary.pricedCount !== summary.count) {
    parts.push(`${summary.pricedCount.toLocaleString('en-US')} list an asking price.`)
  }
  if (summary.syncedAtLabel) parts.push(`Catalog as of ${summary.syncedAtLabel}.`)
  return parts.join(' ')
})
</script>
