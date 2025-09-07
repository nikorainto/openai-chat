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
            // Convert to the format expected by Chat Completions API
            return {
              type: 'image_url',
              image_url: {
                url: item.image,
              },
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

    // Process messages to handle multimodal content
    const processedMessages = messages.map(processMessage)

    // Prepare chat messages for OpenAI Chat Completions API
    const chatMessages = [
      { role: 'system', content: role },
      ...processedMessages,
    ]

    // Use OpenAI Chat Completions API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: chatMessages,
        stream: false,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ OpenAI API error:', error)
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status} - ${error}` },
        { status: response.status },
      )
    }

    const data = await response.json()

    // Get the response text from Chat Completions API
    const responseText =
      data.choices?.[0]?.message?.content || 'No response received'

    // Create a proper streaming response that the frontend can handle
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        // Stream the response text in small chunks for a natural typing effect
        const chunkSize = 3
        for (let i = 0; i < responseText.length; i += chunkSize) {
          const chunk = responseText.slice(i, i + chunkSize)
          controller.enqueue(encoder.encode(chunk))

          // Add a small delay between chunks (Edge Runtime compatible)
          if (i + chunkSize < responseText.length) {
            await new Promise(resolve => setTimeout(resolve, 30))
          }
        }
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
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
