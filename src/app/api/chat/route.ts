import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'
import type { ModelMessage } from 'ai'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

/**
 * Processes a message to handle multimodal content (text + images)
 * Converts our custom JSON format to AI SDK compatible format
 */
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
      webSearchEnabled,
    }: {
      messages: ModelMessage[]
      model: string
      role: string
      apiKey: string
      webSearchEnabled?: boolean
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
      ...(webSearchEnabled && {
        tools: {
          web_search: openai.tools.webSearch({
            // Optional configuration for web search
            searchContextSize: 'high',
          }),
        },
        maxSteps: 5, // Allow multiple tool calls if needed
        onStepFinish: ({ toolCalls }) => {
          // Log tool calls for debugging (consider removing in production)
          if (process.env.NODE_ENV === 'development') {
            console.log(
              'Tool calls:',
              toolCalls.map(tc => tc.toolName),
            )
          }
        },
      }),
    })

    // Create a custom response stream that can inject web search metadata
    const encoder = new TextEncoder()
    const WEB_SEARCH_MARKER = '__WEB_SEARCH_USED__'

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const part of result.fullStream) {
            if (part.type === 'tool-call' && part.toolName === 'web_search') {
              // Inject web search metadata marker into the stream
              controller.enqueue(encoder.encode(`\n${WEB_SEARCH_MARKER}\n`))
            } else if (part.type === 'text-delta') {
              controller.enqueue(encoder.encode(part.text))
            }
          }
        } catch (error) {
          controller.error(error)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Web-Search-Enabled': webSearchEnabled ? 'true' : 'false',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request.' },
      { status: 500 },
    )
  }
}
