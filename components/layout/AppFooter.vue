<template>
  <footer>
    <div class="footer-inner">
      <div>
        <div class="footer-logo">SmallPlane<span>Value</span>.com</div>
        <div class="footer-tagline">Honest GA aircraft valuations · Built for pilots, by pilots.</div>
      </div>
      <div class="footer-links">
        <a href="#tools">Tools</a>
        <a href="#how-it-works">How it works</a>
        <a href="#aircraft-types">Aircraft types</a>
        <a id="footer-share-fb" :href="facebookHref" target="_blank" rel="noopener noreferrer">Share on Facebook</a>
        <a id="footer-share-x" :href="xHref" target="_blank" rel="noopener noreferrer">Share on X</a>
      </div>
    </div>
    <div class="footer-bottom">
      <div>© 2025 SmallPlaneValue.com · All rights reserved</div>
      <div>Not affiliated with FAA, Vref, or Aircraft Bluebook</div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const { facebookHref, xHref } = useShare()
</script>
