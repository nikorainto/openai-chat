import { put, del } from '@vercel/blob'
import { NextResponse, type NextRequest } from 'next/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: 'BLOB_READ_WRITE_TOKEN environment variable is not set' },
        { status: 500 },
      )
    }

    // Generate a unique filename with timestamp and original name
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}_${sanitizedName}`

    const blob = await put(filename, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      filename: filename,
    })
  } catch (error) {
    console.error('Error uploading to blob storage:', error)
    return NextResponse.json(
      { error: 'Failed to upload image to storage' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 })
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn(
        'BLOB_READ_WRITE_TOKEN environment variable is not set, skipping deletion',
      )
      return NextResponse.json({ success: true })
    }

    await del(url, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting from blob storage:', error)
    return NextResponse.json(
      { error: 'Failed to delete image from storage' },
      { status: 500 },
    )
  }
}
