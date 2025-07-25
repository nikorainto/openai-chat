'use client'

import type { Message } from 'ai/react'
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { PiStopFill } from 'react-icons/pi'
import ChatMessage from './ChatMessage'
import ThreeDotsLoader from './ThreeDotsLoader'

type Props = {
  error?: Error
  isLoading: boolean
  messages: Message[]
  stop: () => void
}

export default function ChatMessages({ isLoading, messages, stop, error }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true)

  const errorMessage = useMemo(() => {
    if (!error) return ''
    try {
      const errorObject = JSON.parse(error.message)
      return errorObject.message
    } catch {
      return 'An unexpected error has occurred'
    }
  }, [error])

  const justify = messages.length === 0 ? 'justify-center' : 'justify-start'

  useEffect(() => {
    if (ref.current && shouldScrollToBottom) {
      ref.current.scrollTop = ref.current.scrollHeight
    }
  }, [messages, shouldScrollToBottom])

  const handleScroll = useCallback(() => {
    if (ref.current) {
      const isAtBottom =
        ref.current.scrollTop + ref.current.clientHeight === ref.current.scrollHeight
      setShouldScrollToBottom(isAtBottom)
    }
  }, [])

  const lastMessage = messages?.[messages.length - 1]
  const shouldShowBotLoadingMessage = isLoading && lastMessage && lastMessage.role === 'user'

  return (
    <div
      className={`overflow-auto flex flex-col flex-1 gap-2 items-center ${justify} md:pt-2 md:px-[10%] max-md:px-2`}
      ref={ref}
      onScroll={handleScroll}
    >
      {messages.map((message: Message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {shouldShowBotLoadingMessage && <ThreeDotsLoader />}

      {(isLoading || errorMessage) && (
        <div className="flex flex-col flex-1 items-center justify-end">
          {isLoading && (
            <button
              aria-label="stop generate"
              className="flex gap-2 items-center p-4 rounded bg-neutral-800"
              onClick={stop}
            >
              <PiStopFill />
              <p className="text-sm">Stop</p>
            </button>
          )}
          {errorMessage && <p className="text-center text-red-500">{errorMessage}</p>}
        </div>
      )}
    </div>
  )
}
