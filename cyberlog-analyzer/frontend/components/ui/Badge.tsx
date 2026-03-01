import { Severity } from '@/types'
import clsx from 'clsx'

const styles: Record<Severity, { badge: string; dot: string }> = {
  critical: {
    badge: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
  high: {
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
  },
  medium: {
    badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    dot: 'bg-yellow-500',
  },
  low: {
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
  },
}

export function SeverityBadge({
  severity,
}: {
  severity: Severity | undefined | null
}) {
  if (!severity) return null
  const s = styles[severity] ?? styles.low
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
        s.badge
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full', s.dot)} />
      {severity}
    </span>
  )
}
