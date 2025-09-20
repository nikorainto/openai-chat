import { put } from '@vercel/blob'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 },
      )
    }

    if (!request.body) {
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 },
      )
    }

    // Validate file type (only images)
    if (!filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 },
      )
    }

    const blob = await put(filename, request.body, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return NextResponse.json({
      url: blob.url,
      filename: filename,
    })
  } catch (error) {
    console.error('Blob upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 },
    )
  }
}
