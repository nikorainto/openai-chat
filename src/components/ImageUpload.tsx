'use client'

import { useState, useRef, type ChangeEvent, type DragEvent } from 'react'
import { PiFileBold, PiSpinnerBold } from 'react-icons/pi'

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void
  disabled?: boolean
}

export default function ImageUpload({
  onImageUpload,
  disabled = false,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    try {
      const timestamp = Date.now()
      const filename = `${timestamp}-${file.name}`

      const response = await fetch(
        `/api/blob/upload?filename=${encodeURIComponent(filename)}`,
        {
          method: 'POST',
          body: file,
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
      onImageUpload(result.url)

      // Reset file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
    // Reset the input value so the same file can be selected again
    event.target.value = ''
  }

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)

    const file = event.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      uploadFile(file)
    }
  }

  const handleClick = () => {
    if (!disabled && !isUploading) {
      // Small delay to ensure any pending state updates are complete
      setTimeout(() => {
        fileInputRef.current?.click()
      }, 10)
    }
  }

  // Always show the upload button, don't show the uploaded image here
  // as it's handled in ChatTextarea

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <button
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          p-2 rounded transition-colors
          ${isDragOver ? 'bg-green-600' : 'bg-neutral-700 hover:bg-neutral-600'}
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        disabled={disabled || isUploading}
        aria-label="Upload image"
      >
        {isUploading ? (
          <PiSpinnerBold className="text-xl animate-spin" />
        ) : (
          <PiFileBold className="text-xl" />
        )}
      </button>
    </div>
  )
}
