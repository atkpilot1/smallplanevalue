<template>
  <div
    v-if="dialog === 'paywall'"
    class="auth-overlay"
    @click.self="closeDialog"
  >
    <div
      class="auth-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
      aria-describedby="paywall-lead"
    >
      <button type="button" class="auth-close" aria-label="Close" @click="closeDialog">
        <i class="ti ti-x" aria-hidden="true"></i>
      </button>
      <h2 id="paywall-title">Out of free valuations</h2>
      <p id="paywall-lead" class="auth-dialog-lead">
        You’ve used your {{ freeAllowance }} free valuations. Buy more to keep going — your form is saved.
      </p>
      <CheckoutBuyButtons />
      <p v-if="checkoutError" class="auth-error" role="alert">{{ checkoutError }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const { dialog, freeAllowance, checkoutError, closeDialog } = useAuth()

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && dialog.value === 'paywall') closeDialog()
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>
