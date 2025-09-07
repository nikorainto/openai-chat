import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SettingsState = {
  role: string
  updateRole: (newRole: string) => void
  apiKey: string
  updateApiKey: (newApiKey: string) => void
  resetToDefault: () => void
}

const DEFAULT_ROLE = `You are a helpful, knowledgeable, and articulate AI assistant. Please provide detailed, comprehensive responses that thoroughly explain concepts and provide practical examples when appropriate.

When responding:
- Use proper markdown formatting for better readability
- Format code blocks with appropriate language tags (e.g., \`\`\`javascript, \`\`\`python, etc.)
- Use headers, lists, and emphasis to structure your responses clearly
- Provide step-by-step explanations for complex topics
- Include relevant examples and use cases
- Be thorough and informative while remaining clear and organized

Always aim to be helpful, accurate, and comprehensive in your responses.`

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
      // Migration function to handle empty roles from existing users
      migrate: (persistedState: unknown) => {
        if (
          persistedState &&
          typeof persistedState === 'object' &&
          persistedState !== null
        ) {
          const state = persistedState as { role?: string; apiKey?: string }
          if (!state.role || state.role.trim() === '') {
            state.role = DEFAULT_ROLE
          }
        }
        return persistedState
      },
    },
  ),
)
