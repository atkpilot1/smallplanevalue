<template>
  <p v-if="thanks" style="color:var(--success);font-size:14px;margin-top:1rem;font-weight:600">Thank you for your feedback! This helps us improve SmallPlaneValue.</p>
</template>

<script setup lang="ts">
defineProps<{ thanks: boolean }>()
</script>
