import { useState } from 'react'
import { AiOutlineLoading } from 'react-icons/ai'
import { FaFileAlt } from 'react-icons/fa'
import { PiTrashBold } from 'react-icons/pi'
import { v4 as uuidv4 } from 'uuid'
import { getFilenameFromPathname } from '@/utils/helpers'
import { useFilesStore } from '@/zustand/files'

export default function FileUploads() {
  const [removingUrl, setRemovingUrl] = useState('')

  const documents = useFilesStore((state) => state.documents)
  const removeDocument = useFilesStore((state) => state.removeDocument)

  const handleRemoveDocument = async (url: string) => {
    setRemovingUrl(url)
    try {
      await fetch('/api/del-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })
      removeDocument(url)
      setRemovingUrl('')
    } catch (e) {
      console.error(e)
      setRemovingUrl('')
    }
  }

  return (
    <ul className="overflow-auto flex flex-col gap-2 border border-gray-700 rounded h-3/6 p-1 text-xs">
      {documents.map((doc) => (
        <li key={uuidv4()} className="flex items-center justify-between p-2 rounded bg-gray-600">
          <div className="flex items-center gap-1">
            <a href={doc.url}>
              <FaFileAlt />
            </a>
            <a href={doc.url}>{getFilenameFromPathname(doc.pathname)}</a>
          </div>

          {doc.url === removingUrl ? (
            <AiOutlineLoading className="text-base animate-spin" />
          ) : (
            <PiTrashBold
              onClick={() => handleRemoveDocument(doc.url)}
              className="text-base text-red-500 cursor-pointer"
            />
          )}
        </li>
      ))}
    </ul>
  )
}
