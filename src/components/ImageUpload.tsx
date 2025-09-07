'use client'

import { useRef, useState } from 'react'
import { PiImageBold, PiSpinnerBold } from 'react-icons/pi'

export interface ImageAttachment {
  file: File
  url: string
  base64: string
}

interface Props {
  images: ImageAttachment[]
  onImagesChange: (images: ImageAttachment[]) => void
  disabled?: boolean
}

export default function ImageUpload({
  images,
  onImagesChange,
  disabled,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1]) // Remove data:image/...;base64, prefix
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || disabled) return

    const validFiles = Array.from(files).filter(file => {
      // Check file type
      if (!file.type.startsWith('image/')) return false

      // Check file size (limit to 20MB)
      if (file.size > 20 * 1024 * 1024) {
        alert(
          `File ${file.name} is too large. Please select images under 20MB.`,
        )
        return false
      }

      return true
    })

    if (validFiles.length === 0) return

    setIsProcessing(true)
    const newImages: ImageAttachment[] = []

    try {
      for (const file of validFiles) {
        const base64 = await convertFileToBase64(file)
        const url = URL.createObjectURL(file)
        newImages.push({ file, url, base64 })
      }

      onImagesChange([...images, ...newImages])
    } catch (error) {
      console.error('Error processing images:', error)
      alert('Error processing some images. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClick = () => {
    if (disabled || isProcessing) return
    fileInputRef.current?.click()
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFileSelect(e.target.files)}
        disabled={disabled || isProcessing}
      />

      <button
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className={`flex items-center justify-center p-2 rounded-full transition-colors flex-shrink-0 ${
          disabled || isProcessing
            ? 'text-neutral-500 cursor-not-allowed bg-gray-600'
            : images.length > 0
              ? 'text-white bg-blue-500 hover:bg-blue-600'
              : 'text-neutral-400 bg-neutral-700 hover:bg-neutral-600'
        }`}
        aria-label="Upload image"
        title={
          images.length > 0
            ? `${images.length} image${images.length > 1 ? 's' : ''} attached`
            : 'Upload images'
        }
      >
        {isProcessing ? (
          <PiSpinnerBold className="text-lg animate-spin" />
        ) : (
          <PiImageBold className="text-lg" />
        )}
      </button>
    </>
  )
}
