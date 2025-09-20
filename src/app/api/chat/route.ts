import { createOpenAI } from '@ai-sdk/openai'
import { streamText, convertToModelMessages } from 'ai'
import type { UIMessage } from 'ai'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { messages, model, role, apiKey, imageUrl } = (await req.json()) as {
      messages: UIMessage[]
      model: string
      role: string
      apiKey: string
      imageUrl?: string
    }

    if (!model) {
      return NextResponse.json({ error: 'Model is required' }, { status: 400 })
    }

    const openai = createOpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY || '',
    })

    // Convert messages and add image if provided
    const convertedMessages = convertToModelMessages(messages)

    // If there's an image URL and we have messages, add image to the last user message
    if (imageUrl && convertedMessages.length > 0) {
      const lastMessage = convertedMessages[convertedMessages.length - 1]
      if (lastMessage.role === 'user') {
        lastMessage.content = [
          {
            type: 'text',
            text:
              typeof lastMessage.content === 'string'
                ? lastMessage.content
                : 'Please analyze this image.',
          },
          {
            type: 'image',
            image: imageUrl,
          },
        ]
      }
    }

    const result = streamText({
      model: openai(model),
      messages: [
        {
          role: 'system',
          content: role,
        },
        ...convertedMessages,
      ],
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request.' },
      { status: 500 },
    )
  }
}
