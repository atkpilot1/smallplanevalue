import type { ForSaleCount } from '~/types/app'

const lookups = new Map<string, { timer?: ReturnType<typeof setTimeout>; seq: number }>()

function slot(key: string) {
  let entry = lookups.get(key)
  if (!entry) {
    entry = { seq: 0 }
    lookups.set(key, entry)
  }
  return entry
}

export function useForSaleLookup(key: string) {
  const summary = useState<ForSaleCount | null>(`for-sale-${key}`, () => null)

  function lookup(make: string, model: string, year = '') {
    if (import.meta.server) return
    const mk = make.trim()
    const md = model.trim()
    const enough = (mk.length >= 3 && md.length >= 1) || (mk.length === 0 && md.length >= 4)
    const entry = slot(key)
    if (!enough) {
      if (entry.timer) clearTimeout(entry.timer)
      entry.seq += 1
      summary.value = null
      return
    }
    if (entry.timer) clearTimeout(entry.timer)
    const id = ++entry.seq
    entry.timer = setTimeout(async () => {
      try {
        const data = await apiPost<ForSaleCount>('/api/for-sale-count', {
          make: mk,
          model: md,
          year: year.trim(),
        })
        if (id === entry.seq) summary.value = data
      } catch {
        if (id === entry.seq) summary.value = null
      }
    }, 300)
  }

  return { summary, lookup }
}
