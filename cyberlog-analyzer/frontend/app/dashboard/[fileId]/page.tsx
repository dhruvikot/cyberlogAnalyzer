'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { LogFile, Analysis, Anomaly, LogEntry, Correlation } from '@/types'
import { KPICards } from '@/components/dashboard/KPICards'
import { AISummary } from '@/components/dashboard/AISummary'
import { TimelineChart } from '@/components/dashboard/TimelineChart'
import { AnomalyList } from '@/components/dashboard/AnomalyList'
import { TopIPsTable } from '@/components/dashboard/TopIPsTable'
import { EntriesTable } from '@/components/dashboard/EntriesTable'
import { CorrelationsPanel } from '@/components/dashboard/CorrelationsPanel'
import {
  Shield,
  LogOut,
  Upload,
  Loader2,
  AlertTriangle,
  Activity,
  GitMerge,
  List,
  ArrowLeft,
  History,
  Trash2,
} from 'lucide-react'
import clsx from 'clsx'

type Tab = 'timeline' | 'anomalies' | 'entries' | 'correlations'

const tabs: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: 'timeline', label: 'Timeline', icon: Activity },
  { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
  { id: 'entries', label: 'All Events', icon: List },
  { id: 'correlations', label: 'Correlations', icon: GitMerge },
]

export default function DashboardPage() {
  const { fileId } = useParams<{ fileId: string }>()
  const router = useRouter()
  const { user, logout } = useAuth()

  const [activeTab, setActiveTab] = useState<Tab>('timeline')
  const [file, setFile] = useState<LogFile | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [correlations, setCorrelations] = useState<Correlation[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [fileRes, analysisRes, anomalyRes, entryRes] = await Promise.all([
          api.files.getFile(fileId),
          api.files.getAnalysis(fileId),
          api.files.getAnomalies(fileId),
          api.files.getEntries(fileId, { page: '1', limit: '50' }),
        ])
        setFile(fileRes.file)
        setAnalysis(analysisRes.analysis)
        setAnomalies(anomalyRes.anomalies)
        setEntries(entryRes.entries)
        setPagination(entryRes.pagination)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [fileId])

  useEffect(() => {
    if (!file?.sessionId) return
    api.sessions
      .correlations(file.sessionId)
      .then(res => setCorrelations(res.correlations))
      .catch(() => {})
  }, [file?.sessionId])

  const handleFilterChange = useCallback(
    async (filters: Record<string, string>) => {
      try {
        const res = await api.files.getEntries(fileId, filters)
        setEntries(res.entries)
        setPagination(res.pagination)
      } catch {
        // silent — table stays showing previous results
      }
    },
    [fileId]
  )

  const handlePageChange = useCallback(
    async (page: number) => {
      try {
        const res = await api.files.getEntries(fileId, {
          page: String(page),
          limit: '50',
        })
        setEntries(res.entries)
        setPagination(res.pagination)
      } catch {
        // silent — pagination stays on current page
      }
    },
    [fileId]
  )

  const handleDeleteReport = async () => {
    setDeleting(true)
    try {
      await api.files.deleteFile(fileId)
      router.push('/history')
    } catch {
      alert('Failed to delete report')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading analysis...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white border border-red-200 rounded-xl p-8 text-center max-w-sm shadow-sm">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-slate-700 font-medium mb-2">Failed to load</p>
          <p className="text-slate-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => router.push('/upload')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            Go to Upload
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 shadow-sm px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Shield className="w-5 h-5 text-blue-600 shrink-0" />
            <span className="font-semibold text-slate-900 shrink-0">
              CyberLog Analyzer
            </span>
            {file && (
              <>
                <span className="text-slate-300 mx-1">/</span>
                <span className="text-sm text-slate-500 truncate max-w-xs">
                  {file.originalName}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={() => router.push('/history')}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              <History className="w-4 h-4" />
              History
            </button>
            <button
              onClick={() => router.push('/upload')}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              <Upload className="w-4 h-4" />
              New Upload
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Report
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

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* File header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900">
              {file?.originalName}
            </h1>
            {file?.logType && (
              <span className="text-xs bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase font-medium">
                {file.logType}
              </span>
            )}
            <span className="text-xs bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-full font-medium">
              Analysis Complete
            </span>
          </div>
          {file?.totalLines && (
            <p className="text-sm text-slate-400">
              {file.totalLines.toLocaleString()} log entries analyzed
            </p>
          )}
        </div>

        {/* KPI Cards */}
        {analysis && (
          <div className="mb-6">
            <KPICards analysis={analysis} />
          </div>
        )}

        {/* AI Summary */}
        {file?.aiSummary && (
          <div className="mb-6">
            <AISummary summary={file.aiSummary} />
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-slate-200 mb-6">
          <div className="flex gap-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'anomalies' && anomalies.length > 0 && (
                  <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full font-semibold border border-red-200">
                    {anomalies.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div>
          {activeTab === 'timeline' && analysis && (
            <div className="space-y-4">
              <TimelineChart timeline={analysis.timeline} />
              <TopIPsTable topIPs={(analysis as any).topIps ?? (analysis as any).topIPs} />
            </div>
          )}

          {activeTab === 'anomalies' && (
            <AnomalyList anomalies={anomalies} />
          )}

          {activeTab === 'entries' && (
            <EntriesTable
              entries={entries}
              pagination={pagination}
              onFilterChange={handleFilterChange}
              onPageChange={handlePageChange}
            />
          )}

          {activeTab === 'correlations' && (
            <CorrelationsPanel correlations={correlations} />
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-slate-900 mb-2">
              Delete this report?
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              This will permanently delete the analysis for{' '}
              <span className="font-medium text-slate-900">
                {file?.originalName}
              </span>{' '}
              including all detected anomalies. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReport}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-red-300"
              >
                {deleting ? 'Deleting...' : 'Delete Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
