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

const props = withDefaults(defineProps<{
  inputId: string
  placement?: 'dialog' | 'tools' | 'login'
}>(), {
  placement: 'dialog',
})

const signedOutHint = 'Enter your email below. This code is applied when you finish signing in.'

const { dialog, pendingPromo, rememberPromo, getAccessToken, refreshCredits, closeDialog, openLogin } = useAuth()
const { toast } = useToast()

const code = ref(pendingPromo.value)
const busy = ref(false)
const error = ref(dialog.value === 'login' && pendingPromo.value ? signedOutHint : '')
const message = ref('')

watch(code, (value) => {
  if (props.placement === 'login') rememberPromo(value)
})

async function onSubmit() {
  error.value = ''
  message.value = ''
  const accessToken = await getAccessToken()
  if (!accessToken) {
    rememberPromo(code.value)
    error.value = signedOutHint
    if (dialog.value !== 'login') openLogin()
    return
  }
  busy.value = true
  try {
    const result = await apiPost<{ credits: number }>('/api/promo', { code: code.value }, { accessToken })
    await refreshCredits()
    const added = result.credits
    code.value = ''
    if (dialog.value === 'paywall') {
      closeDialog()
      toast(`${added} valuations added. Click Get honest valuation to continue.`, { variant: 'success' })
    } else {
      message.value = `${added} valuations added.`
    }
  } catch (e) {
    error.value = (e as Error).message || 'Could not apply that code.'
  } finally {
    busy.value = false
  }
}
</script>
