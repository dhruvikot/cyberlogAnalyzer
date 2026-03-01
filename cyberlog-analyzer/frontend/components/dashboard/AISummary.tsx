import { Sparkles } from 'lucide-react'

export function AISummary({ summary }: { summary: string }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-semibold text-blue-700">
          AI Executive Summary
        </span>
        <span className="text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
          Claude AI
        </span>
      </div>
      <p className="text-slate-700 text-sm leading-relaxed">{summary}</p>
    </div>
  )
}
