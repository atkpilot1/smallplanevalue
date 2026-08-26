import type { LookupRecord } from '~/types/app'
import { STATE } from '~/utils/stateKeys'

export function useAircraftContext() {
  const lastLookup = useState<LookupRecord | null>(STATE.lastLookup, () => null)
  const engModel = useState(STATE.ctxEngModel, () => '')
  const acType = useState(STATE.ctxAcType, () => '')
  const numEng = useState<string | number>(STATE.ctxNumEng, () => '')
  const valEngMake = useState(STATE.ctxValEngMake, () => '')
  const valEngModel = useState(STATE.ctxValEngModel, () => '')

  function setLookup(d: LookupRecord | null) {
    lastLookup.value = d
  }

  function clearLookupExtras() {
    engModel.value = ''
    acType.value = ''
    numEng.value = ''
  }

  return {
    lastLookup,
    engModel,
    acType,
    numEng,
    valEngMake,
    valEngModel,
    setLookup,
    clearLookupExtras,
  }
}
