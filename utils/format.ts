export function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString()
}

export function fmtDate(d?: string | null) {
  if (!d) return '—'
  let value = d
  if (/^\d{8}$/.test(value)) {
    value = value.slice(0, 4) + '-' + value.slice(4, 6) + '-' + value.slice(6, 8)
  }
  try {
    const dt = new Date(value)
    if (isNaN(dt.getTime())) return d
    return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return d
  }
}

export function cleanPastedText(raw: string) {
  return (raw || '')
    .trim()
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/[\r]/g, '')
    .replace(/[\u2022]/g, '- ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/  +/g, ' ')
}

export function impactClass(s?: string | null) {
  if (!s) return 'neu'
  const n = parseFloat(s)
  return n > 0 ? 'up' : n < 0 ? 'down' : 'neu'
}
