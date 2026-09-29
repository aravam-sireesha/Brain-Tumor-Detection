import { useCallback, useEffect, useRef, useState } from 'react'
import { FileImage, ImagePlus, Upload, X } from 'lucide-react'

export default function UploadCard({ file, onFileSelected, onClear, onError, disabled = false }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')

  const handleFiles = useCallback(
    (files) => {
      const selectedFile = files?.[0]
      if (!selectedFile) return
      if (!selectedFile.size) {
        onError('The selected file is empty. Please choose another image.')
        return
      }

      const extensionIsValid = /\.(jpe?g|png)$/i.test(selectedFile.name)
      const typeIsValid = ['image/jpeg', 'image/jpg', 'image/png'].includes(selectedFile.type)
      if (!extensionIsValid || (selectedFile.type && !typeIsValid)) {
        onError('Please upload a JPG, JPEG, or PNG MRI image.')
        return
      }
      onError('')
      onFileSelected(selectedFile)
    },
    [onError, onFileSelected]
  )

  useEffect(() => {
    if (!file) {
      setPreviewUrl('')
      return undefined
    }
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        if (!disabled) handleFiles(e.dataTransfer.files)
      }}
      className={`upload-dropzone${dragging ? ' is-dragging' : ''}${file ? ' has-file' : ''}${disabled ? ' is-disabled' : ''}`}
    >
      {previewUrl ? (
        <div className="image-preview">
          <img src={previewUrl} alt={`Preview of ${file.name}`} />
          <div className="image-preview-footer">
            <span className="selected-file"><FileImage size={16} /><span><strong>{file.name}</strong><small>{formatFileSize(file.size)}</small></span></span>
            <button
              type="button"
              onClick={() => { onClear(); onError('') }}
              className="remove-image"
              aria-label="Remove selected image"
              disabled={disabled}
            >
              <X size={16} /> Remove
            </button>
          </div>
          <button
            type="button"
            className="replace-image"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >Choose a different image</button>
        </div>
      ) : (
        <button type="button" className="upload-prompt" onClick={() => inputRef.current?.click()} disabled={disabled}>
          <span className="upload-icon"><ImagePlus size={24} /></span>
          <strong>Upload Brain MRI</strong>
          <span>Drag and drop your MRI image here or</span>
          <span className="browse-link">Browse Files</span>
          <span className="upload-formats"><Upload size={13} /> JPG, JPEG, or PNG</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        id="mri-file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files)
          event.target.value = ''
        }}
      />
    </div>
  )
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return 'Size unavailable'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
