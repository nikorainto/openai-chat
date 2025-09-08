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
import { uploadImageToBlob } from '../utils/blobStorage'
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
          const url = URL.createObjectURL(file)
          const imageAttachment: ImageAttachment = {
            file,
            url,
            isUploading: true,
          }
          newImages.push(imageAttachment)
        } catch (error) {
          console.error('Error processing pasted image:', error)
        }
      }

      // Add images with uploading state first
      const updatedImages = [...images, ...newImages]
      onImagesChange(updatedImages)

      // Upload images to blob storage
      for (let i = 0; i < newImages.length; i++) {
        try {
          const blobData = await uploadImageToBlob(newImages[i].file)
          const imageIndex = images.length + i
          const finalImages = [...updatedImages]
          finalImages[imageIndex] = {
            ...finalImages[imageIndex],
            blobData,
            isUploading: false,
          }
          onImagesChange(finalImages)
        } catch (error) {
          console.error('Error uploading pasted image:', error)
          // Remove the failed image
          const imageIndex = images.length + i
          const finalImages = [...updatedImages]
          finalImages.splice(imageIndex, 1)
          onImagesChange(finalImages)
        }
      }
    }
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
