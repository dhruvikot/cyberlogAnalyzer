'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/services/api'
import { DropZone } from '@/components/upload/DropZone'
import { ProcessingStatus } from '@/components/upload/ProcessingStatus'
import { usePolling } from '@/hooks/usePolling'
import { useAuth } from '@/hooks/useAuth'
import {
  Shield,
  LogOut,
  History,
  CheckCircle,
  GitMerge,
  LayoutDashboard,
  PlusCircle,
} from 'lucide-react'

type Stage = 'idle' | 'uploading' | 'processing' | 'complete' | 'adding'

function FilePoller({
  fileId,
  onComplete,
}: {
  fileId: string
  onComplete: (fileId: string) => void
}) {
  const completedRef = useRef(false)
  const { data } = usePolling(
    () => api.files.getFile(fileId),
    d => d.file.status === 'complete' || d.file.status === 'failed',
    3000
  )

  if (data?.file.status === 'complete' && !completedRef.current) {
    completedRef.current = true
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

  const [stage, setStage] = useState<Stage>('idle')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [completedFileId, setCompletedFileId] = useState<string | null>(null)
  const [completedFileName, setCompletedFileName] = useState('')
  const [anomalyCount, setAnomalyCount] = useState<number | null>(null)
  const [error, setError] = useState('')

  const handleFileSelected = async (file: File) => {
    setStage('uploading')
    setError('')
    setCompletedFileName(file.name)

    try {
      // Reuse existing session if one already exists (multi-file flow)
      let sid = sessionId
      if (!sid) {
        const sessionRes = await api.sessions.create(
          `Session - ${new Date().toLocaleDateString()}`
        )
        sid = sessionRes.session.id
        setSessionId(sid)
      }

      const uploadRes = await api.files.upload(sid, file)
      setActiveFileId(uploadRes.file.id)
      setStage('processing')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setStage(sessionId ? 'adding' : 'idle')
    }
  }

  const handleFileComplete = async (fileId: string) => {
    // Fetch anomaly count from analysis
    let count: number | null = null
    try {
      const analysisRes = await api.files.getAnalysis(fileId)
      count = analysisRes.analysis?.kpis?.anomalyCount ?? null
    } catch {
      // Non-fatal — we just won't show a count
    }
    setCompletedFileId(fileId)
    setAnomalyCount(count)
    setStage('complete')
  }

  const handleAddAnother = () => {
    setActiveFileId(null)
    setCompletedFileId(null)
    setAnomalyCount(null)
    setCompletedFileName('')
    setError('')
    setStage('adding')
  }

  const showDropzone = stage === 'idle' || stage === 'adding'
  const isUploading = stage === 'uploading'

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

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* "Adding to existing session" banner */}
        {stage === 'adding' && (
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6 text-sm">
            <GitMerge className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              <span className="font-medium">Adding to existing session</span>{' '}
              — files in the same session enable cross-log correlation
            </span>
          </div>
        )}

        {/* STATE: idle / adding — show dropzone */}
        {showDropzone && (
          <DropZone
            onFileSelected={handleFileSelected}
            isUploading={isUploading}
          />
        )}

        {/* STATE: uploading — inline progress */}
        {stage === 'uploading' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center shadow-sm">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-600 font-medium">
              Uploading {completedFileName}…
            </p>
          </div>
        )}

        {/* STATE: processing — show poller */}
        {stage === 'processing' && activeFileId && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400 text-center">
              Processing your file — this takes 20–40 seconds
            </p>
            <FilePoller
              fileId={activeFileId}
              onComplete={handleFileComplete}
            />
          </div>
        )}

        {/* STATE: complete — success card */}
        {stage === 'complete' && completedFileId && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center space-y-5">
            <div className="flex justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900 mb-1">
                {completedFileName || 'File'} analyzed successfully
              </p>
              {anomalyCount !== null && (
                <p className="text-sm text-slate-500">
                  {anomalyCount === 0
                    ? 'No anomalies detected'
                    : `${anomalyCount} anomal${anomalyCount === 1 ? 'y' : 'ies'} detected`}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => router.push(`/dashboard/${completedFileId}`)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors shadow-sm"
              >
                <LayoutDashboard className="w-4 h-4" />
                View Dashboard
              </button>
              <button
                onClick={handleAddAnother}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors border border-slate-200 shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Add Another File
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Add another file to the same session to enable cross-log
              correlation
            </p>
          </div>
        )}

        {/* Feature hints — shown only when no upload is in progress */}
        {showDropzone && (
          <div className="mt-10 space-y-4">
            {/* Cross-log hint */}
            <div className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-sm">
              <GitMerge className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <p className="text-slate-500">
                Upload multiple files in the same session to enable cross-log
                correlation across Nginx and ZScaler logs
              </p>
            </div>

            {/* Feature grid */}
            <div className="grid grid-cols-3 gap-4">
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
          </div>
        )}
      </div>
    </div>
  )
}
