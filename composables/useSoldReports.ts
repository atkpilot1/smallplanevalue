import type { SoldEntry } from '~/types/app'

export function getSoldData(): SoldEntry[] {
  if (import.meta.server) return []
  try {
    return JSON.parse(localStorage.getItem('spv_sold') || '[]') as SoldEntry[]
  } catch {
    return []
  }
}

export function saveSoldData(arr: SoldEntry[]) {
  localStorage.setItem('spv_sold', JSON.stringify(arr))
}

export function useSoldReports() {
  const entries = useState<SoldEntry[]>('sold-entries', () => [])

  function load() {
    entries.value = getSoldData()
  }

  function add(entry: SoldEntry) {
    const data = getSoldData()
    data.unshift(entry)
    saveSoldData(data)
    entries.value = data
  }

  onMounted(load)

  return { entries, load, add }
}
