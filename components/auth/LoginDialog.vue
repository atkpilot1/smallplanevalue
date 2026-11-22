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
      <h2 id="login-title">{{ mode === 'access' ? 'Access code' : 'Sign in' }}</h2>
      <p id="login-lead" class="auth-dialog-lead">
        {{ mode === 'access'
          ? 'Enter your code or the beta code. This browser stays signed in for 30 days.'
          : 'Enter your email and we’ll send a 6-digit code. No password needed.' }}
      </p>

      <form v-if="mode === 'access'" class="auth-form" @submit.prevent="onAccess">
        <div class="form-group">
          <label for="auth-access-code">Access code</label>
          <input
            id="auth-access-code"
            ref="accessInput"
            v-model="accessCode"
            type="text"
            autocomplete="off"
            spellcheck="false"
            placeholder="Enter code"
          />
        </div>
        <button class="n-lookup-btn auth-submit" type="submit" :disabled="verifying">
          {{ verifying ? 'Checking…' : 'Continue' }}
        </button>
        <button type="button" class="auth-back" @click="mode = 'email'">Use email instead</button>
      </form>

      <form v-else-if="step === 'email'" class="auth-form" @submit.prevent="onSend">
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
      <button v-if="mode === 'email' && step === 'email'" type="button" class="auth-back" @click="mode = 'access'">
        Use an access code
      </button>

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
  redeemAccessCode,
} = useAuth()

const email = ref('')
const code = ref('')
const accessCode = ref('')
const mode = ref<'email' | 'access'>('email')
const emailInput = ref<HTMLInputElement | null>(null)
const codeInput = ref<HTMLInputElement | null>(null)
const accessInput = ref<HTMLInputElement | null>(null)

watch(dialog, async (open) => {
  if (open !== 'login') return
  email.value = ''
  code.value = ''
  accessCode.value = ''
  mode.value = 'email'
  await nextTick()
  emailInput.value?.focus()
})

watch(mode, async (next) => {
  if (next !== 'access' || dialog.value !== 'login') return
  await nextTick()
  accessInput.value?.focus()
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

async function onAccess() {
  await redeemAccessCode(accessCode.value)
}

function onBack() {
  backToEmail()
  code.value = ''
}
</script>
