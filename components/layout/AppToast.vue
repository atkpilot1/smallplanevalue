<template>
  <div class="app-toasts">
    <div
      v-for="item in toasts"
      :key="item.id"
      class="app-toast"
      :class="'app-toast-' + item.variant"
      role="status"
    >
      <i
        class="ti app-toast-icon"
        :class="item.variant === 'success' ? 'ti-circle-check' : 'ti-info-circle'"
        aria-hidden="true"
      />
      <p class="app-toast-msg">{{ item.message }}</p>
      <button type="button" class="app-toast-close" aria-label="Dismiss" @click="dismiss(item.id)">
        <i class="ti ti-x" aria-hidden="true"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { toasts, dismiss } = useToast()
</script>
