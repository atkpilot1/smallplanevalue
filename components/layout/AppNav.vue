<template>
  <nav>
    <a class="nav-logo" :href="homeHash('#')">
      <div class="nav-logo-icon"><i class="ti ti-plane"></i></div>
      SmallPlane<span class="accent">Value</span>
    </a>
    <div class="nav-links">
      <a :href="homeHash('#tools')">Tools</a>
      <a :href="homeHash('#how-it-works')">How it works</a>
      <NuxtLink to="/aircraft">Aircraft guides</NuxtLink>
      <a :href="homeHash('#app')">Get a valuation</a>
    </div>
    <div class="nav-actions">
      <button class="nav-cta" type="button" @click="scrollToApp">
        Look up my plane
      </button>
      <button class="nav-account" type="button" @click="onAccount">
        {{ user ? 'Manage Account' : 'Sign In' }}
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
const { user, openLogin, openAccount } = useAuth()
const route = useRoute()

function homeHash(hash: string) {
  return route.path === '/' ? hash : `/${hash}`
}

function scrollToApp() {
  if (route.path !== '/') {
    window.location.assign('/#app')
    return
  }
  scrollToTools()
}

function onAccount() {
  if (user.value) openAccount()
  else openLogin()
}
</script>
