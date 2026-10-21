<template>
  <div v-if="summary" class="market-breakout" :data-testid="testId || undefined">
    <template v-if="summary.count > 0">
      <div class="market-breakout-main">
        <div class="market-breakout-num">{{ summary.count.toLocaleString('en-US') }}</div>
        <div class="market-breakout-copy">
          <div class="market-breakout-kicker">On the market</div>
          <div class="market-breakout-line">
            {{ summary.label }} {{ summary.count === 1 ? 'is' : 'are' }} for sale in our Trade-A-Plane catalog.
          </div>
        </div>
      </div>
      <div v-if="extras.length" class="market-breakout-extras">
        <div v-for="extra in extras" :key="extra" class="market-breakout-extra">{{ extra }}</div>
      </div>
    </template>
    <template v-else>
      None like this {{ summary.label }} are for sale in our Trade-A-Plane catalog.
      <span v-if="summary.syncedAtLabel" class="for-sale-meta">Catalog as of {{ summary.syncedAtLabel }}.</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ForSaleCount } from '~/types/app'

const props = withDefaults(defineProps<{
  summary: ForSaleCount | null
  year?: string
  testId?: string
  /** Catalog date is useful on the form. Result cards omit it so the count sits with the prices. */
  showSynced?: boolean
}>(), {
  showSynced: true,
})

const extras = computed(() => {
  const summary = props.summary
  if (!summary || summary.count < 1) return []
  const parts: string[] = []
  if (summary.pricedCount !== summary.count) {
    parts.push(`${summary.pricedCount.toLocaleString('en-US')} list an asking price`)
  }
  if (summary.sameYearCount != null && props.year) {
    const n = summary.sameYearCount
    parts.push(`${n.toLocaleString('en-US')} ${n === 1 ? 'is' : 'are'} listed as ${props.year}`)
  }
  if (props.showSynced && summary.syncedAtLabel) {
    parts.push(`Catalog as of ${summary.syncedAtLabel}`)
  }
  return parts
})
</script>
