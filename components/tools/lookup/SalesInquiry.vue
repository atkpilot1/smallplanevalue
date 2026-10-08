<template>
  <form v-if="!sent" class="sales-inquiry" @submit.prevent="onSubmit">
    <label for="sales-inquiry-email">SALES INQUIRY</label>
    <p class="sales-inquiry-help">Leave your email to ask about this aircraft. We save the N-number, make, and model with your request.</p>
    <div class="sales-inquiry-row">
      <input
        id="sales-inquiry-email"
        v-model="email"
        type="email"
        autocomplete="email"
        placeholder="pilot@email.com"
        :disabled="sending"
      />
      <button class="n-lookup-btn" type="submit" :disabled="sending">
        {{ sending ? 'Sending…' : 'Submit inquiry' }}
      </button>
    </div>
    <p v-if="error" class="sales-inquiry-msg" role="alert">{{ error }}</p>
  </form>
  <p v-else class="sales-inquiry-msg sales-inquiry-ok" role="status">Inquiry received for {{ nNumber }}.</p>
</template>

<script setup lang="ts">
import { trackSalesInquiry } from '~/composables/useAnalytics'

const props = defineProps<{
  nNumber: string
  make?: string
  model?: string
  year?: string | number | null
}>()

const email = ref('')
const sending = ref(false)
const sent = ref(false)
const error = ref('')

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function onSubmit() {
  const trimmed = email.value.trim().toLowerCase()
  if (!isEmail(trimmed)) {
    error.value = 'Enter a valid email address.'
    return
  }
  sending.value = true
  error.value = ''
  try {
    const params = new URLSearchParams(location.search)
    const yearNum = props.year != null && props.year !== '' ? Number(props.year) : null
    await apiPost('/api/lookup-lead', {
      email: trimmed,
      nnumber: props.nNumber,
      make: props.make || null,
      model: props.model || null,
      year: Number.isFinite(yearNum) ? yearNum : null,
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      user_agent: navigator.userAgent,
    })
    trackSalesInquiry({
      n_number: props.nNumber,
      make: props.make || '',
      model: props.model || '',
    })
    sent.value = true
    email.value = ''
  } catch (e) {
    error.value = (e as Error).message || 'Could not send inquiry.'
  } finally {
    sending.value = false
  }
}
</script>
