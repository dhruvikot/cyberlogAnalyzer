'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/services/api'
import { UploadSession, LogFile } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import {
  Shield,
  LogOut,
  Upload,
  ChevronRight,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  History,
  Trash2,
} from 'lucide-react'

export default function HistoryPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [sessions, setSessions] = useState<UploadSession[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    type: 'session' | 'file'
    id: string
    name: string
  } | null>(null)

  useEffect(() => {
    api.sessions
      .getAll()
      .then(res => setSessions(res.sessions.filter(s => s.logFiles.length > 0)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDeleteFile = async (fileId: string) => {
    setDeletingId(fileId)
    try {
      await api.files.deleteFile(fileId)
      setSessions(prev =>
        prev.map(s => ({
          ...s,
          logFiles: s.logFiles.filter(f => f.id !== fileId),
        }))
      )
    } catch {
      alert('Failed to delete file')
    } finally {
      setDeletingId(null)
      setShowDeleteConfirm(null)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    setDeletingId(sessionId)
    try {
      await api.sessions.deleteSession(sessionId)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
    } catch {
      alert('Failed to delete session')
    } finally {
      setDeletingId(null)
      setShowDeleteConfirm(null)
    }
  }

  const getStatusIcon = (status: LogFile['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-slate-400" />
    }
  }

  const getStatusBadge = (status: LogFile['status']) => {
    const map: Record<LogFile['status'], string> = {
      complete: 'text-green-600 bg-green-50 border-green-200',
      failed: 'text-red-600 bg-red-50 border-red-200',
      processing: 'text-blue-600 bg-blue-50 border-blue-200',
      uploaded: 'text-slate-600 bg-slate-100 border-slate-200',
    }
    return map[status]
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 shadow-sm px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-slate-900">
              CyberLog Analyzer
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/upload')}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              <Upload className="w-4 h-4" />
              New Upload
            </button>
            <span className="text-sm text-slate-400">{user?.email}</span>
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

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <History className="w-6 h-6 text-blue-600" />
              Upload History
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              All your previous log analysis sessions
            </p>
          </div>
          <button
            onClick={() => router.push('/upload')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            New Upload
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No uploads yet</p>
            <p className="text-slate-400 text-sm mt-1">
              Upload your first log file to get started
            </p>
            <button
              onClick={() => router.push('/upload')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              Upload Now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map(session => (
              <div
                key={session.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
              >
                {/* Session header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900">
                      {session.name || 'Unnamed Session'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(session.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">
                      {session.logFiles?.length ?? 0} file
                      {(session.logFiles?.length ?? 0) !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setShowDeleteConfirm({
                          type: 'session',
                          id: session.id,
                          name: session.name || 'this session',
                        })
                      }}
                      className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors border border-transparent hover:border-red-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Files in session */}
                <div className="divide-y divide-slate-100">
                  {(session.logFiles ?? []).map(file => (
                    <div
                      key={file.id}
                      className={`px-5 py-3 flex items-center justify-between transition-colors ${
                        file.status === 'complete'
                          ? 'hover:bg-slate-50 cursor-pointer'
                          : ''
                      }`}
                      onClick={() =>
                        file.status === 'complete' &&
                        router.push(`/dashboard/${file.id}`)
                      }
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(file.status)}
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {file.originalName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {file.logType && (
                              <span className="text-xs text-slate-400 uppercase">
                                {file.logType}
                              </span>
                            )}
                            {file.totalLines && (
                              <span className="text-xs text-slate-400">
                                · {file.totalLines.toLocaleString()} lines
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full border font-medium ${getStatusBadge(file.status)}`}
                        >
                          {file.status}
                        </span>
                        {file.status === 'complete' && (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            setShowDeleteConfirm({
                              type: 'file',
                              id: file.id,
                              name: file.originalName,
                            })
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete report"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {(session.logFiles ?? []).length === 0 && (
                    <div className="px-5 py-4 text-sm text-slate-400">
                      No files in this session
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  Delete{' '}
                  {showDeleteConfirm.type === 'session' ? 'Session' : 'Report'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete{' '}
              <span className="font-medium text-slate-900">
                &quot;{showDeleteConfirm.name}&quot;
              </span>
              ?
              {showDeleteConfirm.type === 'session' &&
                ' All files and reports in this session will be permanently deleted.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={!!deletingId}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  showDeleteConfirm.type === 'session'
                    ? handleDeleteSession(showDeleteConfirm.id)
                    : handleDeleteFile(showDeleteConfirm.id)
                }
                disabled={!!deletingId}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {deletingId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
