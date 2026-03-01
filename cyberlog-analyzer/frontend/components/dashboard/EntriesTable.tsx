'use client'
import { useState } from 'react'
import { LogEntry } from '@/types'
import { SeverityBadge } from '@/components/ui/Badge'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  entries: LogEntry[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onFilterChange: (filters: Record<string, string>) => void
  onPageChange: (page: number) => void
}

export function EntriesTable({
  entries,
  pagination,
  onFilterChange,
  onPageChange,
}: Props) {
  const [ip, setIp] = useState('')
  const [severity, setSeverity] = useState('')

  const applyFilters = (overrides?: Record<string, string>) => {
    onFilterChange({
      page: '1',
      limit: '50',
      ip: overrides?.ip ?? ip,
      severity: overrides?.severity ?? severity,
    })
  }

  const clearFilters = () => {
    setIp('')
    setSeverity('')
    onFilterChange({ page: '1', limit: '50', ip: '', severity: '' })
  }

  const hasActiveFilters = ip !== '' || severity !== ''

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Filters bar */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-3 items-center">
        {/* IP Search */}
        <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-3 py-2 focus-within:border-blue-400 transition-colors">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            value={ip}
            onChange={e => setIp(e.target.value)}
            placeholder="Search IP address..."
            className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none w-40"
            onKeyDown={e => {
              if (e.key === 'Enter') applyFilters()
            }}
          />
          {ip && (
            <button onClick={() => { setIp(''); applyFilters({ ip: '' }) }}>
              <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>

        {/* Severity Filter */}
        <select
          value={severity}
          onChange={e => {
            setSeverity(e.target.value)
            applyFilters({ severity: e.target.value })
          }}
          className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 transition-colors cursor-pointer"
        >
          <option value="">All severities</option>
          <option value="critical">🔴 Critical</option>
          <option value="high">🟠 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">⚪ Low</option>
        </select>

        {/* Search button */}
        <button
          onClick={() => applyFilters()}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium"
        >
          Search
        </button>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear filters
          </button>
        )}

        <span className="ml-auto text-xs text-slate-400">
          {pagination.total.toLocaleString()} total events
        </span>
      </div>

      {/* Active filter pills */}
      {hasActiveFilters && (
        <div className="px-5 py-2 bg-blue-50 border-b border-blue-100 flex gap-2">
          <span className="text-xs text-blue-600 font-medium">
            Filters active:
          </span>
          {ip && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              IP: {ip}
            </span>
          )}
          {severity && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">
              Severity: {severity}
            </span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {['Time', 'Source IP', 'Action', 'Target', 'Status', 'Severity', 'Anomaly'].map(h => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-xs text-slate-500 font-semibold uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  No entries match your filters
                </td>
              </tr>
            ) : (
              entries.map(entry => (
                <tr
                  key={entry.id}
                  className={clsx(
                    'border-b border-slate-100 transition-colors',
                    entry.isAnomalous
                      ? 'bg-red-50 hover:bg-red-100'
                      : 'hover:bg-slate-50'
                  )}
                >
                  <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap font-mono text-xs">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-700 text-xs">
                    {entry.sourceIp ?? '-'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono border border-slate-200">
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs max-w-xs truncate">
                    {entry.target}
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    <span
                      className={clsx(
                        'font-mono',
                        entry.statusCode && entry.statusCode >= 400
                          ? 'text-red-600 font-medium'
                          : 'text-slate-500'
                      )}
                    >
                      {entry.statusCode ?? '-'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <SeverityBadge severity={entry.severity} />
                  </td>
                  <td className="px-4 py-2.5">
                    {entry.isAnomalous && (
                      <span className="text-xs text-red-600 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full font-medium">
                        ⚠ Flagged
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Showing {entries.length} of {pagination.total.toLocaleString()} events
          · Page {pagination.page} of {pagination.totalPages}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-slate-200"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Prev
          </button>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-slate-200"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
