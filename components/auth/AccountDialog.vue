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
      <div class="auth-credits">
        <div class="auth-credits-label">Valuation credits</div>
        <div class="auth-credits-value">Coming soon</div>
      </div>
      <button class="n-lookup-btn auth-submit" type="button" @click="signOut">Sign out</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { dialog, user, closeDialog, signOut } = useAuth()

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && dialog.value === 'account') closeDialog()
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>
