import { Anomaly } from '@/types'
import { SeverityBadge } from '@/components/ui/Badge'
import { ConfidenceBar } from '@/components/ui/ConfidenceBar'
import { Sparkles, Shield, Network } from 'lucide-react'

export function AnomalyCard({ anomaly }: { anomaly: Anomaly }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <SeverityBadge severity={anomaly.severity} />
            {anomaly.aiThreatCategory && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                {anomaly.aiThreatCategory}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-slate-800 mt-1.5">
            {anomaly.ruleName}
          </p>
        </div>
        <div className="w-24 shrink-0">
          <p className="text-xs text-slate-400 mb-1">Confidence</p>
          <ConfidenceBar value={anomaly.confidence} />
        </div>
      </div>

      {/* Rule reason */}
      <p className="text-sm text-slate-600 mb-3">{anomaly.reason}</p>

      {/* AI Explanation */}
      {anomaly.aiExplanation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">
              AI Explanation
            </span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            {anomaly.aiExplanation}
          </p>
        </div>
      )}

      {/* Metadata row */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-3">
      {(anomaly.entry?.sourceIp ?? (anomaly as any).sourceIp) && (
            <span className="flex items-center gap-1">
              <Network className="w-3.5 h-3.5" />
              <span className="font-mono">
                {anomaly.entry?.sourceIp ?? (anomaly as any).sourceIp}
              </span>
            </span>
          )}
        {anomaly.aiMitreTechnique && (
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            MITRE: {anomaly.aiMitreTechnique}
          </span>
        )}
        {anomaly.aiAction && (
          <span className="text-blue-600 font-medium">
            → {anomaly.aiAction}
          </span>
        )}
      </div>
    </div>
  )
}
