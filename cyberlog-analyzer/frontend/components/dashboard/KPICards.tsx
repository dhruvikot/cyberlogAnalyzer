import { Analysis } from '@/types'
import { Activity, Globe, ShieldOff, AlertTriangle } from 'lucide-react'

export function KPICards({ analysis }: { analysis: Analysis }) {
  const kpis = analysis.kpis ?? {}
  const cards = [
    {
      label: 'Total Events',
      value: ((kpis as any).totalEvents ?? 0).toLocaleString(),
      icon: Activity,
      style: {
        bg: 'bg-blue-50 border-blue-200',
        icon: 'text-blue-600',
        value: 'text-blue-700',
      },
    },
    {
      label: 'Unique IPs',
      value: ((kpis as any).uniqueIps ?? 0).toLocaleString(),
      icon: Globe,
      style: {
        bg: 'bg-purple-50 border-purple-200',
        icon: 'text-purple-600',
        value: 'text-purple-700',
      },
    },
    {
      label: 'Blocked / Errors',
      value: ((kpis as any).blockedEvents ?? 0).toLocaleString(),
      icon: ShieldOff,
      style: {
        bg: 'bg-amber-50 border-amber-200',
        icon: 'text-amber-600',
        value: 'text-amber-700',
      },
    },
    {
      label: 'Anomalies',
      value: ((kpis as any).anomalyCount ?? 0).toLocaleString(),
      icon: AlertTriangle,
      style: {
        bg: 'bg-red-50 border-red-200',
        icon: 'text-red-600',
        value: 'text-red-700',
      },
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(card => (
        <div
          key={card.label}
          className={`${card.style.bg} rounded-xl border p-4 shadow-sm`}
        >
          <div className="flex items-center gap-2 mb-2">
            <card.icon className={`w-4 h-4 ${card.style.icon}`} />
            <span className="text-xs text-slate-500 font-medium">
              {card.label}
            </span>
          </div>
          <p className={`text-2xl font-bold ${card.style.value}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}
