export function getOrCreateClientId() {
  if (import.meta.server) return ''
  let id = localStorage.getItem('spv_client_id')
  if (!id) {
    id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'spv-' + Date.now() + '-' + Math.random().toString(36).slice(2)
    localStorage.setItem('spv_client_id', id)
  }
  return id
}

export function getValuationEmail() {
  if (import.meta.server) return ''
  return (localStorage.getItem('spv_email') || '').trim()
}
