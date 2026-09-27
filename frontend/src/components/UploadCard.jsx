import { useCallback, useRef, useState } from 'react'
import { UploadCloud, ScanLine, X } from 'lucide-react'

export default function UploadCard({ onFileSelected, previewUrl, onClear }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = useCallback(
    (files) => {
      const file = files?.[0]
      if (!file) return
      if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
        alert('Please upload a JPEG or PNG MRI image.')
        return
      }
      onFileSelected(file)
    },
    [onFileSelected]
  )

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
      className={`relative rounded-xl border-2 border-dashed transition-colors ${
        dragging ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-700 bg-slate-900/40'
      } aspect-square flex items-center justify-center overflow-hidden`}
    >
      {/* scanner corner brackets */}
      <span className="pointer-events-none absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-500/60 rounded-tl-md" />
      <span className="pointer-events-none absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-500/60 rounded-tr-md" />
      <span className="pointer-events-none absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-cyan-500/60 rounded-bl-md" />
      <span className="pointer-events-none absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-500/60 rounded-br-md" />

      {previewUrl ? (
        <>
          <img src={previewUrl} alt="MRI preview" className="w-full h-full object-cover" />
          <button
            onClick={onClear}
            className="absolute top-3 right-10 bg-slate-950/80 hover:bg-slate-950 text-slate-200 rounded-full p-1.5"
            aria-label="Remove image"
          >
            <X size={16} />
          </button>
        </>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center gap-3 text-slate-400 hover:text-cyan-300 transition-colors px-6 text-center"
        >
          <ScanLine size={40} strokeWidth={1.5} />
          <div>
            <p className="font-medium text-slate-200">Drop MRI scan here</p>
            <p className="text-sm text-slate-500 mt-1">or click to browse · JPG / PNG</p>
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
