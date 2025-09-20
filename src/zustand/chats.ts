import type { UIMessage } from 'ai'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Chat = {
  id: string
  input: string
  messages: UIMessage[]
  isSelected: boolean
  uploadedImageUrl?: string
  messageImages: Record<string, string> // messageId -> imageUrl mapping
}

type ChatState = {
  chats: Chat[]
  updateChatInput: (input: string) => void
  updateChatMessages: (messages: UIMessage[]) => void
  updateChatSelection: (chatId: string) => void
  addChat: (chat: Chat) => void
  delChat: (chatId: string) => void
  updateChatImage: (imageUrl?: string) => void
  addMessageImage: (messageId: string, imageUrl: string) => void
}

export const createChat = (): Chat => ({
  id: Date.now().toString(),
  input: '',
  messages: [],
  isSelected: true,
  messageImages: {},
})

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [createChat()],
      updateChatInput: input =>
        set({
          chats: get().chats.map(chat =>
            chat.isSelected ? { ...chat, input } : chat,
          ),
        }),
      updateChatMessages: messages =>
        set({
          chats: get().chats.map(chat =>
            chat.isSelected ? { ...chat, messages } : chat,
          ),
        }),
      updateChatSelection: chatId =>
        set({
          chats: get().chats.map(chat => ({
            ...chat,
            isSelected: chat.id === chatId,
          })),
        }),
      addChat: chat =>
        set({
          chats: [
            ...get().chats.map(chat => ({ ...chat, isSelected: false })),
            chat,
          ],
        }),
      delChat: chatId => {
        const chatToDelete = get().chats.find(chat => chat.id === chatId)

        // Clean up uploaded image if it exists
        if (chatToDelete?.uploadedImageUrl) {
          fetch(
            `/api/blob/delete?url=${encodeURIComponent(chatToDelete.uploadedImageUrl)}`,
            {
              method: 'DELETE',
            },
          ).catch(error => {
            console.error('Failed to delete blob:', error)
          })
        }

        set({
          chats:
            get().chats.length === 1
              ? [createChat()]
              : get()
                  .chats.filter(chat => chat.id !== chatId)
                  .map((chat, index, self) => ({
                    ...chat,
                    isSelected: index === self.length - 1,
                  })),
        })
      },
      updateChatImage: imageUrl =>
        set({
          chats: get().chats.map(chat =>
            chat.isSelected ? { ...chat, uploadedImageUrl: imageUrl } : chat,
          ),
        }),
      addMessageImage: (messageId, imageUrl) =>
        set({
          chats: get().chats.map(chat =>
            chat.isSelected
              ? {
                  ...chat,
                  messageImages: {
                    ...chat.messageImages,
                    [messageId]: imageUrl,
                  },
                }
              : chat,
          ),
        }),
    }),
    {
      name: 'chats',
    },
  ),
)
