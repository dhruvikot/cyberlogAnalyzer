import { Anomaly } from '@/types'
import { AnomalyCard } from './AnomalyCard'
import { ShieldCheck } from 'lucide-react'

export function AnomalyList({ anomalies }: { anomalies: Anomaly[] }) {
  if (anomalies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200 rounded-xl shadow-sm">
        <ShieldCheck className="w-10 h-10 text-green-400 mb-3" />
        <p className="text-slate-600 font-medium">No anomalies detected</p>
        <p className="text-slate-400 text-sm mt-1">
          This log file appears clean
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {anomalies.map(a => (
        <AnomalyCard key={a.id} anomaly={a} />
      ))}
    </div>
  )
}
