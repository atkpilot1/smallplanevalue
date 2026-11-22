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
    <div class="nav-actions">
      <button class="nav-cta" type="button" @click="scrollToApp">
        Look up my plane
      </button>
      <button class="nav-account" type="button" @click="onAccount">
        {{ accountLabel }}
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
const { user, accessRole, openLogin, openAccount } = useAuth()

const accountLabel = computed(() => {
  if (user.value) return 'Manage Account'
  if (accessRole.value === 'beta') return 'Beta access'
  if (accessRole.value === 'owner') return 'Signed in'
  return 'Sign In'
})

function scrollToApp() {
  scrollToTools()
}

function onAccount() {
  if (user.value || accessRole.value) openAccount()
  else openLogin()
}
</script>
