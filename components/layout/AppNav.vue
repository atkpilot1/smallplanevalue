<template>
  <nav>
    <a class="nav-logo" href="#">
      <div class="nav-logo-icon"><i class="ti ti-plane"></i></div>
      SmallPlane<span class="accent">Value</span>
    </a>
    <div class="nav-links">
      <a href="#tools">Tools</a>
      <a href="#how-it-works">How it works</a>
      <a href="#aircraft-types">Aircraft types</a>
      <a href="#app">Get a valuation</a>
    </div>
    <button class="nav-cta" @click="scrollToApp">
      Look up my plane
    </button>
  </nav>
</template>

<script setup lang="ts">
function scrollToApp() {
  scrollToTools()
}
</script>
