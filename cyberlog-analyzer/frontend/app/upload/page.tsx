'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/services/api'
import { DropZone } from '@/components/upload/DropZone'
import { ProcessingStatus } from '@/components/upload/ProcessingStatus'
import { usePolling } from '@/hooks/usePolling'
import { useAuth } from '@/hooks/useAuth'
import { Shield, LogOut, History } from 'lucide-react'

function FilePoller({
  fileId,
  onComplete,
}: {
  fileId: string
  onComplete: (fileId: string) => void
}) {
  const { data } = usePolling(
    () => api.files.getFile(fileId),
    d => d.file.status === 'complete' || d.file.status === 'failed',
    3000
  )

  if (data?.file.status === 'complete') {
    onComplete(fileId)
  }

  if (!data) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 text-center text-slate-400 text-sm animate-pulse shadow-sm">
        Starting analysis pipeline...
      </div>
    )
  }

  return <ProcessingStatus file={data.file} />
}

export default function UploadPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleFileSelected = async (file: File) => {
    setIsUploading(true)
    setError('')
    try {
      const sessionRes = await api.sessions.create(
        `Session - ${new Date().toLocaleDateString()}`
      )
      const uploadRes = await api.files.upload(sessionRes.session.id, file)
      setUploadedFileId(uploadRes.file.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 shadow-sm px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push('/history')}
          >
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-slate-900">
              CyberLog Analyzer
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{user?.email}</span>
            <button
              onClick={() => router.push('/history')}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              <History className="w-4 h-4" />
              History
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Upload Log File
          </h1>
          <p className="text-slate-500">
            Upload a log file to begin automated threat analysis. Supports
            Nginx and ZScaler proxy log formats.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {!uploadedFileId ? (
          <DropZone
            onFileSelected={handleFileSelected}
            isUploading={isUploading}
          />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-400 text-center">
              Processing your file — this takes 20–40 seconds
            </p>
            <FilePoller
              fileId={uploadedFileId}
              onComplete={id => router.push(`/dashboard/${id}`)}
            />
          </div>
        )}

        {/* Feature hints */}
        {!uploadedFileId && (
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              {
                label: 'Auto-Detection',
                desc: 'Identifies log format automatically',
              },
              {
                label: 'Anomaly Detection',
                desc: '5 rules including beaconing & brute force',
              },
              {
                label: 'AI Analysis',
                desc: 'Claude explains each threat in plain English',
              },
            ].map(f => (
              <div
                key={f.label}
                className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm"
              >
                <p className="text-sm font-medium text-slate-800 mb-1">
                  {f.label}
                </p>
                <p className="text-xs text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
