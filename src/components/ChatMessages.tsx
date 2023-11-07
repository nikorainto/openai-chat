'use client'

import type { Message } from 'ai/react'
import { useEffect, useRef, useState } from 'react'
import { PiStopFill } from 'react-icons/pi'
import ChatMessage from './ChatMessage'

type Props = {
  error?: Error
  isLoading: boolean
  messages: Message[]
  stop: () => void
}

export default function ChatMessages({ isLoading, messages, stop, error }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true)
  const errorMessage = error && JSON.parse(error.message).message
  const justify = messages.length === 0 ? 'justify-center' : 'justify-start'

  useEffect(() => {
    if (ref.current && shouldScrollToBottom) {
      ref.current.scrollTop = ref.current.scrollHeight
    }
  }, [messages, shouldScrollToBottom])

  const handleScroll = () => {
    if (ref.current) {
      const isAtBottom =
        ref.current.scrollTop + ref.current.clientHeight === ref.current.scrollHeight
      setShouldScrollToBottom(isAtBottom)
    }
  }

  return (
    <div
      className={`overflow-auto flex flex-col flex-1 gap-2 items-center ${justify} p-2 rounded-lg bg-gray-900`}
      ref={ref}
      onScroll={handleScroll}
    >
      {messages.map((message: Message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {isLoading && messages[messages.length - 1].role === 'user' && (
        <ChatMessage
          key={'bot-message-loading'}
          message={{ id: 'bot-message-loading', content: '...', role: 'assistant' }}
        />
      )}

      {!isLoading && !errorMessage && messages.length === 0 && (
        <p className="text-gray-400">No messages</p>
      )}

      {(isLoading || errorMessage) && (
        <div className="flex flex-col flex-1 items-center justify-end">
          {isLoading && (
            <button className="flex gap-2 items-center p-4 rounded bg-gray-800" onClick={stop}>
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