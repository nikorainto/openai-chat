'use client'

import { useRef, useState } from 'react'
import { PiImageBold, PiSpinnerBold } from 'react-icons/pi'
import { uploadImageToBlob, type BlobImageData } from '../utils/blobStorage'

export interface ImageAttachment {
  file: File
  url: string // Local preview URL
  blobData?: BlobImageData // Vercel Blob storage data
  isUploading?: boolean
}

interface Props {
  images: ImageAttachment[]
  onImagesChange: (images: ImageAttachment[]) => void
  onUploadStateChange?: (isUploading: boolean) => void
  disabled?: boolean
}

export default function ImageUpload({
  images,
  onImagesChange,
  onUploadStateChange,
  disabled,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)

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
    onUploadStateChange?.(true)

    try {
      // First, add images with preview URLs and uploading state
      const newImages: ImageAttachment[] = validFiles.map(file => ({
        file,
        url: URL.createObjectURL(file),
        isUploading: true,
      }))

      const updatedImages = [...images, ...newImages]
      onImagesChange(updatedImages)

      // Upload images to Vercel Blob one by one
      for (let i = 0; i < newImages.length; i++) {
        try {
          const blobData = await uploadImageToBlob(newImages[i].file)

          // Update the specific image with blob data
          const imageIndex = images.length + i
          const finalImages = [...updatedImages]
          finalImages[imageIndex] = {
            ...finalImages[imageIndex],
            blobData,
            isUploading: false,
          }
          onImagesChange(finalImages)
        } catch (error) {
          console.error('Error uploading image:', error)

          // Remove the failed image
          const imageIndex = images.length + i
          const finalImages = [...updatedImages]
          finalImages.splice(imageIndex, 1)
          onImagesChange(finalImages)

          alert(`Failed to upload ${newImages[i].file.name}. Please try again.`)
        }
      }
    } catch (error) {
      console.error('Error processing images:', error)
      alert('Error processing images. Please try again.')
    } finally {
      setIsProcessing(false)
      onUploadStateChange?.(false)
    }
  }

  const handleClick = () => {
    if (disabled || isProcessing) return
    fileInputRef.current?.click()
  }

  const hasUploadingImages = images.some(img => img.isUploading)

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
          hasUploadingImages
            ? 'Uploading images...'
            : images.length > 0
              ? `${images.length} image${images.length > 1 ? 's' : ''} attached`
              : 'Upload images'
        }
      >
        {isProcessing || hasUploadingImages ? (
          <PiSpinnerBold className="text-lg animate-spin" />
        ) : (
          <PiImageBold className="text-lg" />
        )}
      </button>
    </>
  )
}
