'use client'
import { useState, useRef } from 'react'
import { Upload, File, X } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  onFileSelected: (file: File) => void
  isUploading: boolean
}

export function DropZone({ onFileSelected, isUploading }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    setSelectedFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const clearFile = () => {
    setSelectedFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !selectedFile && inputRef.current?.click()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-12 text-center transition-all',
          dragOver
            ? 'border-blue-400 bg-blue-50 scale-[1.01]'
            : selectedFile
            ? 'border-slate-300 bg-white cursor-default'
            : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".log,.txt,.csv"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }}
        />

        {selectedFile ? (
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <File className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-slate-800">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-400">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); clearFile() }}
              className="ml-2 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-slate-100 rounded-xl">
                <Upload className="w-7 h-7 text-slate-400" />
              </div>
            </div>
            <p className="text-slate-700 font-medium mb-1">
              Drop your log file here
            </p>
            <p className="text-slate-400 text-sm mb-3">
              or click to browse
            </p>
            <p className="text-xs text-slate-400">
              Supports .log, .txt, .csv
            </p>
          </>
        )}
      </div>

      {selectedFile && (
        <button
          onClick={() => onFileSelected(selectedFile)}
          disabled={isUploading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors shadow-sm"
        >
          {isUploading ? 'Uploading...' : 'Start Analysis'}
        </button>
      )}
    </div>
  )
}
