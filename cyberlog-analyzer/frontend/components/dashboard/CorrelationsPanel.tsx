import { Correlation } from '@/types'
import { ConfidenceBar } from '@/components/ui/ConfidenceBar'
import { GitMerge, Info } from 'lucide-react'

export function CorrelationsPanel({
  correlations,
}: {
  correlations: Correlation[]
}) {
  if (correlations.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
        <Info className="w-8 h-8 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">No cross-source correlations</p>
        <p className="text-slate-400 text-sm mt-1">
          Correlations appear when the same IP triggers anomalies across multiple
          log files in a session.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {correlations.map(c => (
        <div
          key={c.sourceIp}
          className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-red-600" />
              <span className="font-mono text-sm font-semibold text-slate-800">
                {c.sourceIp}
              </span>
            </div>
            <div className="w-28 shrink-0">
              <p className="text-xs text-slate-400 mb-1">Max Confidence</p>
              <ConfidenceBar value={c.maxConfidence} />
            </div>
          </div>

          <p className="text-sm text-slate-700 mb-3">{c.narrative}</p>

          <div className="flex flex-wrap gap-3 text-xs">
            <span className="text-slate-500">
              Seen in:{' '}
              <span className="font-medium text-slate-700">
                {c.seenIn.join(', ')}
              </span>
            </span>
            <span className="text-red-600 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full font-medium">
              {c.rulesTriggered} rule{c.rulesTriggered !== 1 ? 's' : ''}{' '}
              triggered
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
