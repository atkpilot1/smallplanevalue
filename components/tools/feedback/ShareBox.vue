<template>
  <div class="share-pilot-box">
    <div style="font-size:14px;font-weight:600;color:var(--sky);margin-bottom:6px">Spread the word</div>
    <p style="font-size:13px;color:var(--muted);line-height:1.55;margin-bottom:12px">Share with BeechTalk, Facebook groups, Instagram, or X — every pilot who tries it makes valuations better for everyone.</p>
    <div class="share-btn-row">
      <a class="share-btn" id="share-fb" :href="facebookHref" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i class="ti ti-brand-facebook" aria-hidden="true"></i> Facebook</a>
      <a class="share-btn" id="share-x" :href="xHref" target="_blank" rel="noopener noreferrer" aria-label="X"><i class="ti ti-brand-x" aria-hidden="true"></i> X</a>
      <button type="button" class="share-btn" id="share-copy" @click="copyShareBlurb"><i class="ti ti-copy"></i> Copy for BeechTalk / FB</button>
    </div>
    <p class="share-copy-msg" id="share-copy-msg">{{ copyMsg }}</p>
  </div>
</template>

<script setup lang="ts">
const { facebookHref, xHref, copyMsg, copyShareBlurb } = useShare()
</script>
