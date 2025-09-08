'use client'

import type { ModelMessage } from 'ai'
import type { ChangeEvent, FormEvent, MouseEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PiPaperPlaneRightFill } from 'react-icons/pi'
import ChatMessages from './ChatMessages'
import ChatTextarea from './ChatTextarea'
import ImagePreview from './ImagePreview'
import ImageUpload, { type ImageAttachment } from './ImageUpload'
import { useChatStore } from '@/zustand/chats'
import { useModelStore } from '@/zustand/models'
import { useSettingsStore } from '@/zustand/settings'
import { useUtilsStore } from '@/zustand/utils'

export default function Chat() {
  const chats = useChatStore(state => state.chats)
  const updateChatInput = useChatStore(state => state.updateChatInput)
  const updateChatMessages = useChatStore(state => state.updateChatMessages)
  const models = useModelStore(state => state.models)
  const selectedChat = useMemo(
    () => chats.find(chat => chat.isSelected),
    [chats],
  )
  const selectedModel = useMemo(
    () => models.find(model => model.isSelected),
    [models],
  )
  const role = useSettingsStore(state => state.role)
  const apiKey = useSettingsStore(state => state.apiKey)
  const setStopFunction = useUtilsStore(state => state.setStopFunction)
  const clearStopFunction = useUtilsStore(state => state.clearStopFunction)
  const currentChatIdRef = useRef<string | undefined>(undefined)
  const [images, setImages] = useState<ImageAttachment[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)

  // Manual chat state management
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ModelMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | undefined>()
  const abortControllerRef = useRef<AbortController | null>(null)

  // Stop function
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsLoading(false)
    }
  }, [])

  const append = useCallback(
    async (message: ModelMessage) => {
      try {
        setIsLoading(true)
        setError(undefined)

        const newMessages = [...messages, message]
        setMessages(newMessages)

        abortControllerRef.current = new AbortController()

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages,
            model: selectedModel?.name,
            role,
            apiKey,
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        const decoder = new TextDecoder()
        let assistantMessage = ''

        // Add assistant message placeholder
        const assistantMessageObj: ModelMessage = {
          role: 'assistant',
          content: '',
        }
        setMessages([...newMessages, assistantMessageObj])

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            assistantMessage += chunk

            // Update the last message (assistant message)
            setMessages([
              ...newMessages,
              { ...assistantMessageObj, content: assistantMessage },
            ])
          }
        } finally {
          reader.releaseLock()
        }

        setIsLoading(false)
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err)
        }
        setIsLoading(false)
      }
    },
    [messages, selectedModel, role, apiKey],
  )

  useEffect(() => {
    setStopFunction(stop)
    return () => clearStopFunction()
  }, [stop, setStopFunction, clearStopFunction])

  useEffect(() => {
    if (!selectedChat) {
      return
    }

    const chatSwitched = currentChatIdRef.current !== selectedChat.id

    if (chatSwitched) {
      setInput(selectedChat.input || '')
      setMessages(selectedChat.messages || [])
      setImages([]) // Clear images when switching chats
      currentChatIdRef.current = selectedChat.id
      return
    }

    if (isLoading || messages.length === 0) {
      return
    }

    const messagesChanged =
      messages.length !== selectedChat.messages.length ||
      messages.some(
        (msg, index) =>
          !selectedChat.messages[index] ||
          JSON.stringify(msg) !== JSON.stringify(selectedChat.messages[index]),
      )

    if (messagesChanged) {
      updateChatMessages(messages)
    }
  }, [selectedChat, messages, isLoading, updateChatMessages])

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      updateChatInput(event.target.value)
      setInput(event.target.value)
    },
    [updateChatInput],
  )

  const handleSendMessage = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!input.trim() && images.length === 0) {
        return
      }

      // Check if any images are still uploading
      const hasUploadingImages = images.some(img => img.isUploading)
      if (hasUploadingImages) {
        alert('Please wait for images to finish uploading before sending.')
        return
      }

      // Check if the selected model supports vision
      // GPT-4.1 support vision capabilities
      const visionSupportedModels = ['gpt-4.1']
      const supportsVision = visionSupportedModels.includes(
        selectedModel?.name || '',
      )

      if (images.length > 0 && !supportsVision) {
        alert(`Image uploads are only supported with vision-capable models.
        
Your current model: ${selectedModel?.name}
Supported models: ${visionSupportedModels.join(', ')}
        
Please select a compatible model from the dropdown menu to use image functionality.`)
        return
      }

      // Create content array for multimodal message
      const content: Array<{ type: string; text?: string; image?: string }> = []

      if (input.trim()) {
        content.push({ type: 'text', text: input.trim() })
      }

      if (images.length > 0) {
        images.forEach(image => {
          if (image.blobData?.url) {
            content.push({
              type: 'image',
              image: image.blobData.url,
            })
          }
        })
      }

      // Clear input and images
      updateChatInput('')
      setInput('')

      // Clean up image URLs
      images.forEach(image => URL.revokeObjectURL(image.url))
      setImages([])

      // Send message with content array
      await append({
        role: 'user',
        content:
          content.length === 1 && content[0].type === 'text'
            ? content[0].text!
            : JSON.stringify(content),
      })
    },
    [input, images, selectedModel, updateChatInput, append],
  )

  const handleSendMessageClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      handleSendMessage(event as unknown as FormEvent<HTMLFormElement>)
    },
    [handleSendMessage],
  )

  const handleImagesChange = useCallback((newImages: ImageAttachment[]) => {
    setImages(newImages)
  }, [])

  const handleUploadStateChange = useCallback((uploading: boolean) => {
    setIsUploadingImages(uploading)
  }, [])

  // Check if any images are still uploading or if we're in upload state
  const hasUploadingImages =
    images.some(img => img.isUploading) || isUploadingImages
  const isSubmitDisabled =
    isLoading || hasUploadingImages || (!input.trim() && images.length === 0)

  return (
    <div className="overflow-hidden flex flex-col flex-1 gap-2">
      <ChatMessages
        error={error}
        isLoading={isLoading}
        messages={messages}
        stop={stop}
      />

      <div className="p-1 m-1 md:mt-0 md:ml-0 max-md:mt-0">
        <ImagePreview
          images={images}
          onImagesChange={handleImagesChange}
          disabled={isLoading}
        />

        <div className="flex items-center gap-1 rounded-lg bg-neutral-900 p-1">
          <ChatTextarea
            selectedChatId={selectedChat?.id}
            input={input}
            onChange={handleChange}
            onSendMessage={handleSendMessage}
            images={images}
            onImagesChange={handleImagesChange}
            disabled={isLoading}
          />
          <ImageUpload
            images={images}
            onImagesChange={handleImagesChange}
            onUploadStateChange={handleUploadStateChange}
            disabled={isLoading}
          />
          <button
            aria-label="send message"
            className="flex items-center justify-center p-2 rounded-full bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed flex-shrink-0"
            onClick={handleSendMessageClick}
            disabled={isSubmitDisabled}
          >
            <PiPaperPlaneRightFill className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  )
}
