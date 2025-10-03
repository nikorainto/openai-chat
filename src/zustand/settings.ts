import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SettingsState = {
  role: string
  updateRole: (newRole: string) => void
  apiKey: string
  updateApiKey: (newApiKey: string) => void
  webSearchEnabled: boolean
  updateWebSearchEnabled: (enabled: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      role: '',
      updateRole: newRole => set({ role: newRole }),
      apiKey: '',
      updateApiKey: newApiKey => set({ apiKey: newApiKey }),
      webSearchEnabled: true,
      updateWebSearchEnabled: enabled => set({ webSearchEnabled: enabled }),
    }),
    {
      name: 'settings',
    },
  ),
)
