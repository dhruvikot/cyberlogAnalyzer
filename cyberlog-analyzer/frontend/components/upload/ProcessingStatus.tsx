import { LogFile } from '@/types'
import {
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Brain,
  ShieldAlert,
  Clock,
} from 'lucide-react'
import clsx from 'clsx'

const stages: Array<{
  statuses: LogFile['status'][]
  label: string
  description: string
  icon: typeof Loader2
}> = [
  {
    statuses: ['uploaded', 'processing', 'complete', 'failed'],
    label: 'File Received',
    description: 'Stored securely on disk',
    icon: CheckCircle,
  },
  {
    statuses: ['processing', 'complete', 'failed'],
    label: 'Parsing Logs',
    description: 'Auto-detecting format & streaming entries',
    icon: Search,
  },
  {
    statuses: ['complete', 'failed'],
    label: 'Anomaly Detection',
    description: 'Running 5 rule-based detection engines',
    icon: ShieldAlert,
  },
  {
    statuses: ['complete'],
    label: 'AI Enrichment',
    description: 'Claude explaining threats & MITRE mapping',
    icon: Brain,
  },
]

export function ProcessingStatus({ file }: { file: LogFile }) {
  const progress =
    file.totalLines && file.parsedLines
      ? Math.round((file.parsedLines / file.totalLines) * 100)
      : null

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      {/* File info header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-medium text-slate-800">{file.originalName}</p>
          <p className="text-xs text-slate-400 mt-0.5 uppercase tracking-wide">
            {file.logType ?? 'Detecting...'}
          </p>
        </div>
        <StatusPill status={file.status} />
      </div>

      {/* Progress bar */}
      {progress !== null && file.status === 'processing' && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>Parsing progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {file.parsedLines && (
            <p className="text-xs text-slate-400 mt-1">
              {file.parsedLines.toLocaleString()} /{' '}
              {file.totalLines?.toLocaleString()} lines
            </p>
          )}
        </div>
      )}

      {/* Stage indicators */}
      <div className="space-y-3">
        {stages.map(stage => {
          const isDone = stage.statuses.includes(file.status)
          const isActive =
            file.status === 'processing' &&
            stage.statuses.includes('processing') &&
            !stage.statuses.includes('complete')

          return (
            <div key={stage.label} className="flex items-center gap-3">
              <div
                className={clsx(
                  'p-1.5 rounded-lg transition-colors',
                  isDone && file.status !== 'failed'
                    ? 'bg-green-100 text-green-600'
                    : isActive
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-slate-100 text-slate-400'
                )}
              >
                {isActive ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <stage.icon className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="flex-1">
                <p
                  className={clsx(
                    'text-sm font-medium',
                    isDone && file.status !== 'failed'
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  )}
                >
                  {stage.label}
                </p>
                <p className="text-xs text-slate-400">{stage.description}</p>
              </div>
              {isDone && file.status !== 'failed' && !isActive && (
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              )}
            </div>
          )
        })}
      </div>

      {file.status === 'failed' && file.errorMessage && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs text-red-600">{file.errorMessage}</p>
        </div>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: LogFile['status'] }) {
  const map: Record<
    LogFile['status'],
    { label: string; cls: string; icon: typeof Clock }
  > = {
    uploaded: {
      label: 'Queued',
      cls: 'text-slate-600 bg-slate-100 border-slate-200',
      icon: Clock,
    },
    processing: {
      label: 'Processing',
      cls: 'text-blue-600 bg-blue-50 border-blue-200',
      icon: Loader2,
    },
    complete: {
      label: 'Complete',
      cls: 'text-green-600 bg-green-50 border-green-200',
      icon: CheckCircle,
    },
    failed: {
      label: 'Failed',
      cls: 'text-red-600 bg-red-50 border-red-200',
      icon: XCircle,
    },
  }
  const s = map[status]
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border',
        s.cls
      )}
    >
      {status === 'processing' ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <s.icon className="w-3 h-3" />
      )}
      {s.label}
    </span>
  )
}
