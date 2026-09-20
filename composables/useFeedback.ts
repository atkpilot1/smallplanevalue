import type { FeedbackEntry } from '~/types/app'

export async function sendAppFeedback(opts: {
  email?: string
  aircraft?: string
  accuracy?: string
  message?: string
}) {
  const entry: FeedbackEntry = {
    email: opts.email || '',
    aircraft: opts.aircraft || '',
    accuracy: opts.accuracy || '',
    message: opts.message || '',
    ts: new Date().toISOString(),
  }
  try {
    const fb = JSON.parse(localStorage.getItem('spv_feedback') || '[]') as FeedbackEntry[]
    fb.push(entry)
    localStorage.setItem('spv_feedback', JSON.stringify(fb))
  } catch {
    /* ignore quota / parse errors — same as the original page */
  }
  try {
    const resp = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: entry.email || null,
        aircraft: entry.aircraft || null,
        accuracy: entry.accuracy || null,
        message: entry.message || null,
      }),
    })
    const d = await resp.json().catch(() => ({})) as { error?: string }
    return resp.ok && !d.error
  } catch {
    return false
  }
}
