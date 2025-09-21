import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'
import type { ModelMessage } from 'ai'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

function processMessage(message: ModelMessage): ModelMessage {
  // Check if the content is a JSON string (multimodal message)
  if (typeof message.content === 'string' && message.content.startsWith('[')) {
    try {
      const contentArray = JSON.parse(message.content)

      // Convert our format to AI SDK format
      const aiContent = contentArray.map(
        (item: { type: string; text?: string; image?: string }) => {
          if (item.type === 'text') {
            return { type: 'text', text: item.text }
          } else if (item.type === 'image') {
            // For Vercel AI SDK, use the URL directly
            return {
              type: 'image',
              image: item.image,
            }
          }
          return item
        },
      )

      return { ...message, content: aiContent }
    } catch {
      // If parsing fails, treat as regular text
      return message
    }
  }

  return message
}

export async function POST(req: Request) {
  try {
    const {
      messages,
      model,
      role,
      apiKey,
    }: {
      messages: ModelMessage[]
      model: string
      role: string
      apiKey: string
    } = await req.json()

    const key = apiKey || process.env.OPENAI_API_KEY || ''

    if (!key || key === 'test' || key === 'test-key') {
      return NextResponse.json(
        {
          error:
            'Please provide a valid OpenAI API key. You can find your API key at https://platform.openai.com/account/api-keys.',
        },
        { status: 400 },
      )
    }

    const openai = createOpenAI({
      apiKey: key,
    })

    // Process messages to handle multimodal content
    const processedMessages = messages.map(processMessage)

    const result = streamText({
      model: openai(model),
      messages: [
        ...(role ? [{ role: 'system' as const, content: role }] : []),
        ...processedMessages,
      ],
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request.' },
      { status: 500 },
    )
  }
}
