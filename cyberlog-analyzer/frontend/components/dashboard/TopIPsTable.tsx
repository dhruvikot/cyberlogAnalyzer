import { Analysis } from '@/types'

export function TopIPsTable({ topIPs }: { topIPs: Analysis['topIPs'] }) {
  const list = (topIPs ?? []) as any[]
  const max = list[0]?.count || 1

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700">
          Top Source IPs
        </h3>
      </div>
      <div className="divide-y divide-slate-100">
        {list.map((ip, i) => {
          const label = ip.sourceIp ?? ip.ip ?? '—'
          return (
            <div key={`${label}-${i}`} className="px-5 py-3 flex items-center gap-3">
              <span className="text-xs text-slate-400 w-5 text-center">
                {i + 1}
              </span>
              <span className="font-mono text-sm text-slate-700 flex-1">
                {label}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(ip.count / max) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-12 text-right">
                  {(ip.count ?? 0).toLocaleString()}
                </span>
              </div>
            </div>
          )
        })}
        {list.length === 0 && (
          <div className="px-5 py-8 text-center text-slate-400 text-sm">
            No IP data available
          </div>
        )}
      </div>
    </div>
  )
}
