<template>
  <div
    class="tab-pane"
    :class="{ active: activeTab === 'feedback' }"
    role="tabpanel"
    id="pane-feedback"
    data-testid="pane-feedback"
    aria-labelledby="tab-btn-feedback"
  >
    <p style="font-size:14px;color:var(--muted);line-height:1.6;margin-bottom:1rem">Help us improve SmallPlaneValue — we're in free beta and want your honest take.</p>
    <ShareBox />
    <div class="form-group"><label>YOUR EMAIL (optional)</label><input type="text" id="fb-email" placeholder="pilot@email.com" v-model="email" /></div>
    <div class="form-group"><label for="fb-aircraft">AIRCRAFT</label><input type="text" id="fb-aircraft" placeholder="e.g. 1981 Beech B58 Baron" v-model="aircraft" /></div>
    <div class="form-group">
      <label for="fb-accuracy">VALUATION ACCURACY</label>
      <select id="fb-accuracy" v-model="accuracy">
        <option value="">N/A</option>
        <option value="low">Too low</option>
        <option value="right">About right</option>
        <option value="high">Too high</option>
      </select>
    </div>
    <div class="form-group"><label for="fb-message">YOUR FEEDBACK</label><textarea id="fb-message" rows="4" placeholder="What did we get wrong? What features do you want?" v-model="message"></textarea></div>
    <button class="submit-btn" id="fb-btn" :disabled="sending" @click="submitFeedback">
      <i class="ti" :class="sending ? 'ti-loader-2' : 'ti-send'"></i> {{ sending ? 'Sending...' : 'Send feedback' }}
    </button>
    <div id="fb-result" data-testid="feedback-result">
      <FeedbackResult :thanks="thanks" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { sendAppFeedback } from '~/composables/useFeedback'
import { trackEvent } from '~/composables/useAnalytics'

const { activeTab } = useToolsTab()
const email = ref('')
const aircraft = ref('')
const accuracy = ref('')
const message = ref('')
const sending = ref(false)
const thanks = ref(false)

async function submitFeedback() {
  if (!message.value.trim() && !accuracy.value) {
    alert('Please enter feedback or select accuracy.')
    return
  }
  sending.value = true
  await sendAppFeedback({
    email: email.value.trim(),
    aircraft: aircraft.value.trim(),
    accuracy: accuracy.value,
    message: message.value.trim(),
  })
  trackEvent('feedback_submitted', { source: 'feedback_tab', accuracy: accuracy.value || 'none' })
  thanks.value = true
  email.value = ''
  aircraft.value = ''
  accuracy.value = ''
  message.value = ''
  sending.value = false
}
</script>
