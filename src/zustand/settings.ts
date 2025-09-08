import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SettingsState = {
  role: string
  updateRole: (newRole: string) => void
  apiKey: string
  updateApiKey: (newApiKey: string) => void
  resetToDefault: () => void
}

const DEFAULT_ROLE = ''

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      role: DEFAULT_ROLE,
      updateRole: newRole => set({ role: newRole }),
      apiKey: '',
      updateApiKey: newApiKey => set({ apiKey: newApiKey }),
      resetToDefault: () => set({ role: DEFAULT_ROLE }),
    }),
    {
      name: 'settings',
    },
  ),
)
