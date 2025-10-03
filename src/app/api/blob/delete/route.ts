import { del } from '@vercel/blob'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    await del(url, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Blob delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 },
    )
  }
}
