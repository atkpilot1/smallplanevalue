import type { TabId } from '~/types/app'
import { STATE } from '~/utils/stateKeys'

export function scrollToTools() {
  if (!import.meta.client) return
  document.getElementById('app')?.scrollIntoView({ behavior: 'smooth' })
}

export function useToolsTab() {
  const activeTab = useState<TabId>(STATE.toolsTab, () => 'lookup')

  function switchTab(id: TabId) {
    activeTab.value = id
    scrollToTools()
  }

  return { activeTab, switchTab }
}
