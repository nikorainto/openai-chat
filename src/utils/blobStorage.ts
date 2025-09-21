import type { ModelMessage } from 'ai'

export interface BlobImageData {
  url: string
  pathname: string
  filename: string
}

/**
 * Upload an image file to Vercel Blob storage via API route
 */
export async function uploadImageToBlob(file: File): Promise<BlobImageData> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/blob', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to upload image')
    }

    const blobData = await response.json()
    return blobData
  } catch (error) {
    console.error('Error uploading image to blob storage:', error)
    throw new Error('Failed to upload image to storage')
  }
}

/**
 * Delete an image from Vercel Blob storage via API route
 */
export async function deleteImageFromBlob(url: string): Promise<void> {
  try {
    const response = await fetch(`/api/blob?url=${encodeURIComponent(url)}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Error deleting image from blob storage:', errorData.error)
    }
  } catch (error) {
    console.error('Error deleting image from blob storage:', error)
    // Don't throw here as this is cleanup - we don't want to break the app if cleanup fails
  }
}

/**
 * Extract image URLs from chat messages to track what needs to be cleaned up
 */
export function extractImageUrlsFromMessages(
  messages: ModelMessage[],
): string[] {
  const imageUrls: string[] = []

  for (const message of messages) {
    if (
      typeof message.content === 'string' &&
      message.content.startsWith('[')
    ) {
      try {
        const contentArray = JSON.parse(message.content)
        for (const item of contentArray) {
          if (
            item.type === 'image' &&
            item.image &&
            typeof item.image === 'string'
          ) {
            // Check if it's a blob URL (not base64)
            if (item.image.includes('blob.vercel-storage.com')) {
              imageUrls.push(item.image)
            }
          }
        }
      } catch {
        // Ignore parsing errors
      }
    }
  }

  return imageUrls
}
