<template>
  <p v-if="authorized" class="tradeshow-status" role="status">Tradeshow access is on.</p>
</template>

<script setup lang="ts">
const { authorized } = useTradeshowAccess()
</script>
