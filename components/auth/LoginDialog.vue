<template>
  <div
    v-if="dialog === 'login'"
    class="auth-overlay"
    @click.self="closeDialog"
  >
    <div
      class="auth-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
      aria-describedby="login-lead"
    >
      <button type="button" class="auth-close" aria-label="Close" @click="closeDialog">
        <i class="ti ti-x" aria-hidden="true"></i>
      </button>
      <h2 id="login-title">Sign in</h2>
      <p id="login-lead" class="auth-dialog-lead">
        Enter your email and we’ll send a 6-digit code. No password needed.
      </p>

      <form v-if="step === 'email'" class="auth-form" @submit.prevent="onSend">
        <div class="form-group">
          <label for="auth-email">Email</label>
          <input
            id="auth-email"
            ref="emailInput"
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="pilot@email.com"
          />
        </div>
        <button class="n-lookup-btn auth-submit" type="submit" :disabled="sending">
          {{ sending ? 'Sending…' : 'Send code' }}
        </button>
      </form>

      <form v-else class="auth-form" @submit.prevent="onVerify">
        <p class="auth-sent">Code sent to {{ otpEmail }}</p>
        <div class="form-group">
          <label for="auth-code">Verification code</label>
          <input
            id="auth-code"
            ref="codeInput"
            v-model="code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            placeholder="123456"
          />
        </div>
        <button class="n-lookup-btn auth-submit" type="submit" :disabled="verifying">
          {{ verifying ? 'Verifying…' : 'Verify' }}
        </button>
        <button type="button" class="auth-back" @click="onBack">Use a different email</button>
      </form>

      <p v-if="error" class="auth-error" role="alert">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const {
  dialog,
  error,
  sending,
  verifying,
  otpEmail,
  step,
  closeDialog,
  sendCode,
  verifyCode,
  backToEmail,
} = useAuth()

const email = ref('')
const code = ref('')
const emailInput = ref<HTMLInputElement | null>(null)
const codeInput = ref<HTMLInputElement | null>(null)

watch(dialog, async (open) => {
  if (open !== 'login') return
  email.value = ''
  code.value = ''
  await nextTick()
  emailInput.value?.focus()
})

watch(step, async (s) => {
  if (s !== 'code') return
  code.value = ''
  await nextTick()
  codeInput.value?.focus()
})

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && dialog.value === 'login') closeDialog()
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

async function onSend() {
  await sendCode(email.value)
}

async function onVerify() {
  await verifyCode(code.value)
}

function onBack() {
  backToEmail()
  code.value = ''
}
</script>
