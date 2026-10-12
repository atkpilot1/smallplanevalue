<template>
  <form
    class="promo-code"
    :class="{
      'promo-code-tools': placement === 'tools',
      'promo-code-login': placement === 'login',
    }"
    @submit.prevent="onSubmit"
  >
    <label :for="inputId">Tradeshow or promo code</label>
    <div class="promo-code-row">
      <input
        :id="inputId"
        v-model="code"
        type="text"
        autocomplete="off"
        autocapitalize="characters"
        spellcheck="false"
        maxlength="40"
        :placeholder="placement === 'login' ? 'TRADESHOW' : 'Enter code'"
        :disabled="busy"
      />
      <button class="n-lookup-btn" type="submit" :disabled="busy || !code.trim()">
        {{ busy ? 'Applying…' : 'Apply' }}
      </button>
    </div>
    <p v-if="message" class="auth-sent" role="status">{{ message }}</p>
    <p v-if="error" class="auth-error" role="alert">{{ error }}</p>
  </form>
</template>

<script setup lang="ts">
import { apiPost } from '~/composables/useApi'
import { matchPromo } from '~/utils/promo'

const props = withDefaults(defineProps<{
  inputId: string
  placement?: 'dialog' | 'tools' | 'login'
}>(), {
  placement: 'dialog',
})

const signedOutHint = 'Tradeshow access is on. Sign in with your email to run a valuation.'

const { dialog, pendingPromo, rememberPromo, getAccessToken, refreshCredits, closeDialog, openLogin } = useAuth()
const { authorize } = useTradeshowAccess()
const { toast } = useToast()

const code = ref(pendingPromo.value)
const busy = ref(false)
const error = ref('')
const message = ref(dialog.value === 'login' && matchPromo(pendingPromo.value) ? signedOutHint : '')

watch(code, (value) => {
  if (props.placement !== 'login') return
  rememberPromo(value)
  if (!matchPromo(value)) return
  authorize(value)
  error.value = ''
  message.value = signedOutHint
})

async function onSubmit() {
  error.value = ''
  message.value = ''
  if (!matchPromo(code.value)) {
    error.value = 'That code isn’t valid.'
    return
  }
  authorize(code.value)
  rememberPromo(code.value)
  const accessToken = await getAccessToken()
  if (!accessToken) {
    message.value = signedOutHint
    if (dialog.value !== 'login') openLogin()
    return
  }
  busy.value = true
  try {
    const result = await apiPost<{ credits: number }>('/api/promo', { code: code.value }, { accessToken })
    await refreshCredits()
    const added = result.credits
    const notice = `Tradeshow access is on. ${added} valuations added.`
    if (dialog.value === 'paywall') {
      closeDialog()
      toast(notice, { variant: 'success' })
    } else {
      message.value = notice
    }
  } catch (e) {
    const msg = (e as Error).message || 'Could not apply that code.'
    if (/already used/i.test(msg)) {
      message.value = 'Tradeshow access is on.'
    } else {
      message.value = 'Tradeshow access is on.'
      error.value = msg
    }
  } finally {
    busy.value = false
  }
}
</script>
