<template>
  <div style="margin-bottom:16px;padding:14px;background:rgba(19,64,116,0.04);border:1px dashed var(--sky);border-radius:var(--radius)">
    <div style="font-size:12px;font-weight:500;color:var(--sky);margin-bottom:8px;letter-spacing:.03em">PASTE A LISTING (optional)</div>
    <textarea
      id="v-paste"
      rows="4"
      style="width:100%;font-size:13px;margin-bottom:8px"
      aria-label="Paste a listing"
      placeholder="Paste an aircraft listing from Controller, Trade-A-Plane, Barnstormers, etc. We will auto-fill all fields and avionics for you..."
      v-model="paste"
    ></textarea>
    <button class="n-lookup-btn" id="paste-btn" :disabled="loading" @click="parseListing" style="width:auto;padding:8px 20px">Auto-fill from listing</button>
    <Spinner id="paste-spin" :on="loading" message="Parsing listing..." />
  </div>
</template>

<script setup lang="ts">
import type { ParsedListing } from '~/types/app'
import { cleanPastedText } from '~/utils/format'

const val = useValuationForm()
const paste = val.paste
const loading = ref(false)

async function parseListing() {
  const txt = cleanPastedText(paste.value)
  if (!txt) {
    alert('Paste a listing first.')
    return
  }
  loading.value = true
  try {
    const d = await apiPost<ParsedListing>('/api/parse-listing', { text: txt.substring(0, 5000) })
    val.resetForm()
    val.applyParsedListing(d)
    await val.refreshEngineLife()
  } catch (e) {
    console.error('Parse failed:', e)
    alert('Could not parse listing. Try entering details manually.')
  }
  loading.value = false
}
</script>
