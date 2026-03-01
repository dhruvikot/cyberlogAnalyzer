'use client'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Analysis } from '@/types'

export function TimelineChart({ timeline }: { timeline: Analysis['timeline'] }) {
  const data = (timeline ?? []).map(t => ({
    time: new Date(t.bucket).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    events: t.count,
    threats: (t as any).highCount ?? (t as any).threats ?? 0,
  }))

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        Event Timeline (5-min buckets)
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="eventsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="threatsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              color: '#1e293b',
              fontSize: 12,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#64748b' }}
          />
          <Area
            type="monotone"
            dataKey="events"
            name="Events"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#eventsGrad)"
          />
          <Area
            type="monotone"
            dataKey="threats"
            name="Threats"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#threatsGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
