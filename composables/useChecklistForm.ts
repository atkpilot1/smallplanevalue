import type { LookupRecord } from '~/types/app'
import { engineSelectFromMake } from '~/utils/lookupPrefill'
import { STATE } from '~/utils/stateKeys'

export function useChecklistForm() {
  const ctx = useAircraftContext()
  const make = useState(STATE.clMake, () => '')
  const model = useState(STATE.clModel, () => '')
  const year = useState(STATE.clYear, () => '')
  const eng = useState(STATE.clEng, () => 'Lycoming')
  const resultToken = useState(STATE.clClear, () => 0)

  function prefillFromLookup(d: LookupRecord) {
    ctx.engModel.value = d.engineModel || ''
    ctx.acType.value = d.aircraftType || ''
    ctx.numEng.value = d.numEngines || ''
    make.value = d.make || ''
    model.value = d.model || ''
    year.value = d.year != null ? String(d.year) : ''
    const mapped = engineSelectFromMake(d.engineMake)
    if (mapped) eng.value = mapped
  }

  function clearResults() {
    resultToken.value++
  }

  return { make, model, year, eng, resultToken, prefillFromLookup, clearResults }
}
