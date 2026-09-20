<template>
  <section class="hero">
    <div class="hero-bg"></div>
    <div class="hero-content">
      <div class="hero-kicker">
        <i class="ti ti-sparkles" style="font-size:13px"></i>
        The Honest GA Valuation Tool
      </div>
      <h1 class="hero-h1">
        Know What Your<br>
        <span class="line2">Plane Is Worth.</span>
      </h1>
      <p class="hero-sub">
        Real asking price ranges for piston singles, twins, LSA, and experimental aircraft — with transparent discount bands, not fabricated sale prices.
      </p>
      <p class="hero-compare">Unlike index tools or 20-page reports — built for the listing you're looking at right now.</p>
      <div class="hero-actions">
        <a href="#app" class="btn-primary">
          <i class="ti ti-calculator"></i> Get a free valuation
        </a>
        <a href="#how-it-works" class="btn-ghost">
          <i class="ti ti-info-circle"></i> How it works
        </a>
      </div>
      <div class="hero-stats">
        <div>
          <div class="hero-stat-val">6</div>
          <div class="hero-stat-lbl">Aircraft categories</div>
        </div>
        <div>
          <div class="hero-stat-val">AI</div>
          <div class="hero-stat-lbl">Powered estimates</div>
        </div>
        <div>
          <div class="hero-stat-val">100%</div>
          <div class="hero-stat-lbl">Free to use</div>
        </div>
        <div>
          <div class="hero-stat-val">0</div>
          <div class="hero-stat-lbl">Fabricated sale prices</div>
        </div>
      </div>
    </div>
    <ShowcaseGrid :planes="planes" />
  </section>
</template>

<script setup lang="ts">
import type { ShowcasePlane } from '~/utils/showcase'

defineProps<{ planes: ShowcasePlane[] }>()
</script>
