import type { ReactNode } from 'react'
import React from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  children?: ReactNode
}

const Modal: React.FC<Props> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 my-2"
      onClick={onClose}
    >
      <div
        className="m-2 bg-modal p-5 rounded-lg relative overflow-y-auto max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export default Modal
