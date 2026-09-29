import { useEffect, useState } from 'react'
import { ScanLine } from 'lucide-react'

export default function ImagePreview({ file, alt = 'Uploaded MRI scan preview' }) {
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    if (!file) {
      setPreviewUrl('')
      return undefined
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  if (!previewUrl) {
    return (
      <div className="result-image-empty">
        <ScanLine size={30} />
        <span>Image preview unavailable</span>
      </div>
    )
  }

  return <img className="result-image" src={previewUrl} alt={alt} />
}
