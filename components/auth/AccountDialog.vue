<template>
  <div
    v-if="dialog === 'account'"
    class="auth-overlay"
    @click.self="closeDialog"
  >
    <div
      class="auth-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-title"
    >
      <button type="button" class="auth-close" aria-label="Close" @click="closeDialog">
        <i class="ti ti-x" aria-hidden="true"></i>
      </button>
      <h2 id="account-title">Manage account</h2>
      <p class="auth-dialog-lead">Signed in as</p>
      <p class="auth-email">{{ user?.email }}</p>
      <p v-if="showAccount" class="auth-dialog-lead">This login can run valuations at a show without buying credits.</p>
      <div v-if="!showAccount" class="auth-credits">
        <div class="auth-credits-row">
          <div id="free-remaining-label" class="auth-credits-label">Free remaining</div>
          <div class="auth-credits-value" aria-labelledby="free-remaining-label">{{ freeRemaining }}</div>
        </div>
        <div class="auth-credits-row">
          <div id="paid-credits-label" class="auth-credits-label">Paid credits</div>
          <div class="auth-credits-value" aria-labelledby="paid-credits-label">{{ creditBalance }}</div>
        </div>
        <div class="auth-credits-row">
          <div id="valuation-count-label" class="auth-credits-label">Valuations run</div>
          <div class="auth-credits-value" aria-labelledby="valuation-count-label">{{ valuationCount }}</div>
        </div>
      </div>
      <CheckoutBuyButtons v-if="!showAccount" />
      <p v-if="checkoutError" class="auth-error" role="alert">{{ checkoutError }}</p>
      <button class="n-lookup-btn auth-submit" type="button" @click="signOut">Sign out</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isShowEmail } from '~/utils/showAccess'

const {
  dialog,
  user,
  valuationCount,
  creditBalance,
  freeRemaining,
  checkoutError,
  closeDialog,
  signOut,
} = useAuth()

const showAccount = computed(() => isShowEmail(user.value?.email))

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && dialog.value === 'account') closeDialog()
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>
