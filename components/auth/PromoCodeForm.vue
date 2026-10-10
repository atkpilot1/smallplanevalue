<template>
  <form
    class="promo-code"
    :class="{ 'promo-code-tools': placement === 'tools' }"
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
        placeholder="Enter code"
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

withDefaults(defineProps<{
  inputId: string
  placement?: 'dialog' | 'tools'
}>(), {
  placement: 'dialog',
})

const code = ref('')
const busy = ref(false)
const error = ref('')
const message = ref('')

const { dialog, getAccessToken, refreshCredits, closeDialog, openLogin } = useAuth()
const { toast } = useToast()

async function onSubmit() {
  error.value = ''
  message.value = ''
  const accessToken = await getAccessToken()
  if (!accessToken) {
    error.value = 'Sign in, then apply the code.'
    openLogin()
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
