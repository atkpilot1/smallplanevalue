<template>
  <AppNav />
  <main class="guide">
    <p class="section-kicker">Aircraft guides</p>
    <h1 class="section-h2">Value the airplane you are actually considering.</h1>
    <p class="section-body">
      A Baron, a Bonanza, a Cirrus, and a Malibu do not share one price. These guides explain what to enter, then open the valuation on that model. Come back when the next airplane is a different one.
    </p>
    <div class="guide-index">
      <NuxtLink v-for="guide in AIRCRAFT_GUIDES" :key="guide.slug" class="guide-card" :to="`/aircraft/${guide.slug}`">
        <div class="section-kicker">{{ guide.kicker }}</div>
        <div class="guide-card-name">{{ guide.name }}</div>
        <p>{{ guide.description }}</p>
      </NuxtLink>
    </div>
  </main>
  <AppFooter />
</template>

<script setup lang="ts">
import { AIRCRAFT_GUIDES } from '~/data/aircraftGuides'

usePageSeo({
  title: 'Aircraft value guides — Baron, Bonanza, Cirrus, Malibu',
  description: 'Model-specific guides for valuing a Beech Baron, Beech Bonanza, Cirrus SR22, or Piper Malibu. Honest asking ranges, no fabricated sale prices.',
  path: '/aircraft',
})
</script>
