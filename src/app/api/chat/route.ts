import { createOpenAI } from '@ai-sdk/openai'
import { streamText, convertToModelMessages } from 'ai'
import type { UIMessage } from 'ai'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { messages, model, role, apiKey } = (await req.json()) as {
      messages: UIMessage[]
      model: string
      role: string
      apiKey: string
    }

    if (!model) {
      return NextResponse.json({ error: 'Model is required' }, { status: 400 })
    }

    const openai = createOpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY || '',
    })

    const result = streamText({
      model: openai(model),
      messages: [
        {
          role: 'system',
          content: role,
        },
        ...convertToModelMessages(messages),
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
