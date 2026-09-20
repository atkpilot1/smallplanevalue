<template>
  <div class="auth-buy">
    <button
      class="n-lookup-btn auth-submit"
      type="button"
      :disabled="checkoutBusy"
      @click="startCheckout('single')"
    >
      1 valuation — $24
    </button>
    <button
      class="n-lookup-btn auth-submit"
      type="button"
      :disabled="checkoutBusy"
      @click="startCheckout('pack')"
    >
      5 valuations — $75
    </button>
  </div>
</template>

<script setup lang="ts">
const { checkoutBusy, startCheckout } = useAuth()
</script>
