const MAX_EDGE = 1600
const MAX_DATA_CHARS = 1_400_000

export interface ListingImage {
  mediaType: 'image/jpeg'
  data: string
  previewUrl: string
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

async function encodeJpeg(bitmap: ImageBitmap, edge: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not read that screenshot.')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality)
  })
  if (!blob) throw new Error('Could not read that screenshot.')
  return blob
}

/** Shrink a listing screenshot to a JPEG the parse API can read. */
export async function fileToListingImage(file: File): Promise<ListingImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Use a PNG, JPEG, or WebP screenshot.')
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error('That screenshot is too large. Try a smaller image.')
  }

  const bitmap = await createImageBitmap(file)
  try {
    const attempts: Array<[number, number]> = [
      [MAX_EDGE, 0.72],
      [MAX_EDGE, 0.55],
      [1200, 0.5],
      [1000, 0.42],
    ]
    let blob: Blob | null = null
    for (const [edge, quality] of attempts) {
      blob = await encodeJpeg(bitmap, edge, quality)
      if (Math.ceil(blob.size / 3) * 4 <= MAX_DATA_CHARS) break
    }
    if (!blob || Math.ceil(blob.size / 3) * 4 > MAX_DATA_CHARS) {
      throw new Error('That screenshot is too large. Try a smaller image.')
    }
    const data = bytesToBase64(new Uint8Array(await blob.arrayBuffer()))
    return { mediaType: 'image/jpeg', data, previewUrl: URL.createObjectURL(blob) }
  } finally {
    bitmap.close()
  }
}
