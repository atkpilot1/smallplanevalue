import { readTradeshowCode, saveTradeshowCode } from '~/utils/tradeshowAccess'

export function useTradeshowAccess() {
  const authorized = useState('tradeshow-authorized', () => false)

  function sync() {
    authorized.value = !!readTradeshowCode()
  }

  function authorize(raw: string) {
    const ok = saveTradeshowCode(raw)
    authorized.value = ok || !!readTradeshowCode()
    return ok
  }

  // Read after mount so the server render and the first client render match.
  onMounted(sync)

  return { authorized, authorize, sync }
}
