import type { CoreMessage } from 'ai'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

function processMessage(message: CoreMessage): CoreMessage {
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

function messagesToInput(
  messages: CoreMessage[],
  role: string,
): { input: string; hasImages: boolean } {
  // Convert messages to input format for the Responses API
  let input = ''
  let hasImages = false

  if (role) {
    input += `System: ${role}\n\n`
  }

  messages.forEach(message => {
    if (message.role === 'user') {
      if (typeof message.content === 'string') {
        // Check if the string contains image data (JSON format)
        if (message.content.startsWith('[')) {
          try {
            const contentArray = JSON.parse(message.content)
            const hasImageInContent = contentArray.some(
              (item: { type: string }) => item.type === 'image',
            )
            if (hasImageInContent) {
              hasImages = true
            }
            // Extract text for input
            const textParts = contentArray
              .filter(
                (item: { type: string; text?: string }) => item.type === 'text',
              )
              .map((item: { type: string; text?: string }) => item.text)
              .join(' ')
            if (textParts) {
              input += `User: ${textParts}\n\n`
            }
          } catch {
            input += `User: ${message.content}\n\n`
          }
        } else {
          input += `User: ${message.content}\n\n`
        }
      } else if (Array.isArray(message.content)) {
        // Handle already processed multimodal content
        const textParts = message.content
          .filter(part => part.type === 'text')
          .map(part => ('text' in part ? part.text : ''))
          .join(' ')

        // Check if there are images (any type that's not text)
        const imageCount = message.content.filter(
          part => part.type !== 'text',
        ).length
        if (imageCount > 0) {
          hasImages = true
        }

        if (textParts) {
          input += `User: ${textParts}\n\n`
        }
      }
    } else if (message.role === 'assistant') {
      input += `Assistant: ${message.content}\n\n`
    }
  })

  return { input: input.trim(), hasImages }
}

export async function POST(req: Request) {
  try {
    const {
      messages,
      model,
      role,
      apiKey,
    }: {
      messages: CoreMessage[]
      model: string
      role: string
      apiKey: string
    } = await req.json()

    const key = apiKey || process.env.OPENAI_API_KEY || ''

    if (!key || key === 'test' || key === 'test-key') {
      return NextResponse.json(
        {
          error:
            'Please provide a valid OpenAI API key. You can find your API key at https://platform.openai.com/account/api-keys. Note: GPT-5 may require special access or beta invitation.',
        },
        { status: 400 },
      )
    }

    // Process messages to handle multimodal content
    const processedMessages = messages.map(processMessage)

    // Convert conversation to input format for GPT-5 Responses API
    const { input, hasImages } = messagesToInput(processedMessages, role)

    // If images are present, use Chat Completions API as it has better multimodal support
    const useResponsesAPI = !hasImages

    let response: Response | undefined
    let isResponsesAPI = useResponsesAPI

    if (useResponsesAPI) {
      // Use Responses API for text-only conversations
      const requestBody = {
        model: model,
        input: input,
        text: {
          verbosity: 'low',
        },
      }

      try {
        response = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

        // If Responses API fails, fall back to Chat Completions
        if (!response.ok) {
          isResponsesAPI = false
          response = undefined
        }
      } catch {
        isResponsesAPI = false
        response = undefined
      }
    }

    // Use Chat Completions API (either fallback or for images)
    if (!isResponsesAPI || !response) {
      const chatMessages = [
        { role: 'system', content: role },
        ...processedMessages,
      ]

      response = await fetch('https://api.openai.com/v1/chat/completions', {
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

      isResponsesAPI = false
    }

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ OpenAI API error:', error)
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status} - ${error}` },
        { status: response.status },
      )
    }

    const data = await response.json()

    // Get the response text based on which API was used
    let responseText: string
    if (isResponsesAPI) {
      // GPT-5 Responses API format - extract from the complex structure
      if (data.output && Array.isArray(data.output)) {
        // Find the message output (type: "message")
        const messageOutput = data.output.find(
          (item: { type: string }) => item.type === 'message',
        )
        if (
          messageOutput &&
          messageOutput.content &&
          Array.isArray(messageOutput.content)
        ) {
          // Find the text content
          const textContent = messageOutput.content.find(
            (item: { type: string; text?: string }) =>
              item.type === 'output_text',
          )
          responseText = textContent?.text || 'No text content found'
        } else {
          responseText = 'No message output found'
        }
      } else {
        // Fallback for other possible response formats
        responseText = data.text || data.response || 'No response received'
      }
    } else {
      // Chat Completions API format
      responseText =
        data.choices?.[0]?.message?.content || 'No response received'
    }

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
