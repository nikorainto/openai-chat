'use client'

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type ClipboardEvent,
} from 'react'
import type { ImageAttachment } from './ImageUpload'

type Props = {
  selectedChatId?: string
  input: string
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void
  onSendMessage: (event: FormEvent<HTMLFormElement>) => void
  images: ImageAttachment[]
  onImagesChange: (images: ImageAttachment[]) => void
  disabled?: boolean
}

const lineHeight = 24
const maxHeight = 320

export default function ChatTextarea({
  selectedChatId,
  input,
  onChange,
  onSendMessage,
  images,
  onImagesChange,
  disabled,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [overflow, setOverflow] = useState('overflow-hidden')

  useEffect(() => {
    const textarea = ref.current

    if (selectedChatId && textarea) {
      textarea.focus()
    }
  }, [selectedChatId])

  useEffect(() => {
    const textarea = ref.current

    if (!textarea) return

    // Set height to auto to get the actual scroll height
    textarea.style.height = 'auto'

    // Set the height based on scroll height, with minimum and maximum
    const newHeight = Math.min(
      Math.max(textarea.scrollHeight, lineHeight),
      maxHeight,
    )
    textarea.style.height = `${newHeight}px`

    // Update overflow based on whether we've hit the max height
    if (textarea.scrollHeight > maxHeight) {
      setOverflow('overflow-auto')
    } else {
      setOverflow('overflow-hidden')
    }
  }, [input])

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      if (event.shiftKey || /Mobi|Android/i.test(navigator.userAgent)) {
        return
      }

      event.preventDefault()
      onSendMessage(event as unknown as FormEvent<HTMLFormElement>)
      return
    }
  }

  const handlePaste = async (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData?.items
    if (!items) return

    const imageFiles: File[] = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          imageFiles.push(file)
        }
      }
    }

    if (imageFiles.length > 0) {
      event.preventDefault()

      const newImages: ImageAttachment[] = []

      for (const file of imageFiles) {
        try {
          const base64 = await convertFileToBase64(file)
          const url = URL.createObjectURL(file)
          newImages.push({ file, url, base64 })
        } catch (error) {
          console.error('Error converting pasted image:', error)
        }
      }

      onImagesChange([...images, ...newImages])
    }
  }

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1]) // Remove data:image/...;base64, prefix
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  return (
    <div className="flex flex-col gap-1 flex-1">
      <textarea
        className={`flex flex-1 p-2 rounded outline-none resize-none bg-transparent leading-6 ${overflow}`}
        style={{ minHeight: `${lineHeight}px`, maxHeight: `${maxHeight}px` }}
        id="chat-textarea"
        ref={ref}
        autoFocus
        placeholder={
          images.length > 0
            ? 'Ask a question about the images...'
            : 'Type your prompt…'
        }
        value={input}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        disabled={disabled}
      />
    </div>
  )
}
