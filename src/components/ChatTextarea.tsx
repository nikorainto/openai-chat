'use client'

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { PiXBold } from 'react-icons/pi'
import ImageUpload from './ImageUpload'

type Props = {
  selectedChatId?: string
  input: string
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void
  onSendMessage: (event: FormEvent<HTMLFormElement>) => void
  uploadedImageUrl?: string
  onImageUpload: (imageUrl: string) => void
  onImageRemove: () => void
}

const lineHeight = 32
const maxHeight = 384

export default function ChatTextarea({
  selectedChatId,
  input,
  onChange,
  onSendMessage,
  uploadedImageUrl,
  onImageUpload,
  onImageRemove,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [overflow, setOverflow] = useState('overflow-hidden')
  const [rows, setRows] = useState(1)

  useEffect(() => {
    const textarea = ref.current

    if (selectedChatId && textarea) {
      textarea.focus()
    }
  }, [selectedChatId])

  useEffect(() => {
    const hasInput = input.split(/\r?\n/).length > 1 || input.length > 0
    const textarea = ref.current

    if (!hasInput || !textarea) {
      setRows(1)
      setOverflow('overflow-hidden')
      return
    }

    setRows(textarea.scrollHeight / lineHeight - 1)

    if (textarea.scrollHeight > maxHeight) {
      setOverflow('overflow-auto')
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

  return (
    <div className="flex flex-1 flex-col gap-2">
      {uploadedImageUrl && (
        <div className="flex items-center gap-2 p-2 bg-neutral-800 rounded">
          <img
            src={uploadedImageUrl}
            alt="Uploaded"
            className="w-12 h-12 rounded border border-gray-600 object-cover"
          />
          <span className="text-sm text-gray-400">File attached</span>
          <button
            onClick={e => {
              e.preventDefault()
              onImageRemove()
              // Refocus textarea after removing image
              setTimeout(() => {
                if (ref.current) {
                  ref.current.focus()
                }
              }, 0)
            }}
            className="ml-auto p-1 hover:bg-red-600 rounded text-white bg-red-500 cursor-pointer"
          >
            <PiXBold className="text-xs" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <textarea
          className={`flex flex-1 p-4 max-h-96 rounded outline-none resize-none bg-neutral-900 leading-8 ${overflow}`}
          id="chat-textarea"
          ref={ref}
          autoFocus
          placeholder="Type your prompt…"
          value={input}
          rows={rows}
          onChange={onChange}
          onKeyDown={handleKeyDown}
        />
        <div className="flex items-center">
          <ImageUpload onImageUpload={onImageUpload} />
        </div>
      </div>
    </div>
  )
}
