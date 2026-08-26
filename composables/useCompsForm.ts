import type { LookupRecord } from '~/types/app'
import { compsModelFromLookup } from '~/utils/lookupPrefill'
import { STATE } from '~/utils/stateKeys'

export function useCompsForm() {
  const model = useState(STATE.compsModel, () => '')

  function prefillFromLookup(d: LookupRecord) {
    model.value = compsModelFromLookup(d)
  }

  return { model, prefillFromLookup }
}
