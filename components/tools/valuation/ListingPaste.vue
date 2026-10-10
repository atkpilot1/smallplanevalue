<template>
  <div
    style="margin-bottom:16px;padding:14px;background:rgba(19,64,116,0.04);border:1px dashed var(--sky);border-radius:var(--radius)"
    @paste="onPaste"
    @dragover.prevent="dragOver = true"
    @dragleave.prevent="dragOver = false"
    @drop.prevent="onDrop"
  >
    <div style="font-size:12px;font-weight:500;color:var(--sky);margin-bottom:4px;letter-spacing:.03em">PASTE A LISTING (optional)</div>
    <p style="font-size:12px;color:var(--muted);margin:0 0 8px">Paste the text, or paste, drop, or upload a screenshot of the listing.</p>
    <textarea
      id="v-paste"
      rows="4"
      style="width:100%;font-size:13px;margin-bottom:8px"
      aria-label="Paste a listing"
      placeholder="Paste an aircraft listing from Controller, Trade-A-Plane, Barnstormers, etc. Or drop a screenshot — we will auto-fill the fields and avionics."
      v-model="paste"
    ></textarea>
    <div v-if="image" class="listing-shot" data-testid="listing-screenshot">
      <img :src="image.previewUrl" alt="Listing screenshot preview" />
      <span style="font-size:13px;color:var(--sky)">Screenshot ready</span>
      <button type="button" class="listing-shot-remove" @click="clearImage">Remove screenshot</button>
    </div>
    <div class="listing-actions">
      <button class="n-lookup-btn" id="paste-btn" :disabled="loading" @click="parseListing" style="width:auto;padding:8px 20px">Auto-fill from listing</button>
      <label class="n-lookup-btn listing-upload" for="v-paste-file">
        <i class="ti ti-photo" aria-hidden="true"></i> Upload screenshot
      </label>
      <input
        id="v-paste-file"
        class="listing-file-input"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        aria-label="Upload a listing screenshot"
        @change="onFile"
      />
    </div>
    <p v-if="dragOver" style="margin:8px 0 0;font-size:12px;color:var(--sky)">Drop the screenshot to use it.</p>
    <Spinner id="paste-spin" :on="loading" :message="image ? 'Reading screenshot...' : 'Parsing listing...'" />
  </div>
</template>

<script setup lang="ts">
import type { ParsedListing } from '~/types/app'
import { cleanPastedText } from '~/utils/format'
import { fileToListingImage, type ListingImage } from '~/utils/listingImage'

const val = useValuationForm()
const paste = val.paste
const loading = ref(false)
const image = ref<ListingImage | null>(null)
const dragOver = ref(false)

function clearImage() {
  if (image.value) URL.revokeObjectURL(image.value.previewUrl)
  image.value = null
  const input = document.getElementById('v-paste-file') as HTMLInputElement | null
  if (input) input.value = ''
}

onBeforeUnmount(clearImage)

async function useFile(file: File | null | undefined) {
  if (!file) return
  try {
    const next = await fileToListingImage(file)
    clearImage()
    image.value = next
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Could not read that screenshot.')
  }
}

function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  void useFile(input.files?.[0])
}

function onPaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault()
      void useFile(item.getAsFile())
      return
    }
  }
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) void useFile(file)
}

async function parseListing() {
  const txt = cleanPastedText(paste.value)
  if (!txt && !image.value) {
    alert('Paste a listing or add a screenshot first.')
    return
  }
  loading.value = true
  try {
    const body: { text?: string; image?: { mediaType: string; data: string } } = {}
    if (txt) body.text = txt.substring(0, 5000)
    if (image.value) body.image = { mediaType: image.value.mediaType, data: image.value.data }
    const d = await apiPost<ParsedListing>('/api/parse-listing', body)
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
