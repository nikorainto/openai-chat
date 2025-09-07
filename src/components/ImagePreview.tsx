/* eslint-disable @next/next/no-img-element */
'use client'

import { PiXBold } from 'react-icons/pi'
import type { ImageAttachment } from './ImageUpload'

interface Props {
  images: ImageAttachment[]
  onImagesChange: (images: ImageAttachment[]) => void
  disabled?: boolean
}

export default function ImagePreview({
  images,
  onImagesChange,
  disabled,
}: Props) {
  const handleRemoveImage = (index: number) => {
    const imageToRemove = images[index]
    URL.revokeObjectURL(imageToRemove.url)
    onImagesChange(images.filter((_, i) => i !== index))
  }

  if (images.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1 p-1 bg-neutral-800 rounded mb-1">
      {images.map((image, index) => (
        <div key={index} className="relative group">
          <img
            src={image.url}
            alt={`Upload ${index + 1}`}
            className="w-12 h-12 object-cover rounded border border-neutral-600"
          />
          <button
            onClick={() => handleRemoveImage(index)}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove image"
            disabled={disabled}
          >
            <PiXBold className="text-xs text-white" />
          </button>
        </div>
      ))}
      <div className="flex items-center text-xs text-neutral-400 px-1">
        {images.length} image{images.length > 1 ? 's' : ''} attached
      </div>
    </div>
  )
}
