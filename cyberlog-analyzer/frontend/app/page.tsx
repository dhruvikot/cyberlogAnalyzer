'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/services/api'
import {
  Shield,
  Upload,
  AlertTriangle,
  Brain,
  ArrowRight,
  Zap,
  FileSearch,
  GitMerge,
  Lock,
} from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [loggedIn] = useState(() => api.auth.checkAuth())

  const features = [
    {
      icon: FileSearch,
      title: 'Auto Log Detection',
      desc: 'Upload any log file. Automatically detects Nginx and ZScaler proxy formats.',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: AlertTriangle,
      title: 'Anomaly Detection',
      desc: '5 rule-based detectors: IP spikes, beaconing, brute force, data exfiltration, path scanning.',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      desc: 'Claude AI explains every anomaly in plain English with MITRE ATT&CK mapping.',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      icon: GitMerge,
      title: 'Cross-Log Correlation',
      desc: 'Upload multiple files to identify threats that span across different log sources.',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      icon: Zap,
      title: 'SOC-Ready Dashboard',
      desc: 'Timeline charts, KPI cards, filterable event tables, and anomaly cards in one view.',
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      icon: Lock,
      title: 'Secure Multi-User',
      desc: 'Each analyst has their own account. All reports are private and persisted.',
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ]

  const stats = [
    { value: '5', label: 'Detection Rules' },
    { value: '2', label: 'Log Formats' },
    { value: 'AI', label: 'Threat Explanation' },
    { value: '100%', label: 'Private & Secure' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 shadow-sm px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-lg">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">CyberLog Analyzer</span>
          </div>
          <div className="flex items-center gap-3">
            {loggedIn ? (
              <>
                <button
                  onClick={() => router.push('/upload')}
                  className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Upload
                </button>
                <button
                  onClick={() => router.push('/history')}
                  className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  History
                </button>
                <button
                  onClick={() => router.push('/history')}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Go to App
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push('/login')}
                  className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => router.push('/signup')}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Get Started Free
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <Zap className="w-3 h-3" />
          AI-Powered Security Log Analysis
        </div>
        <h1 className="text-5xl font-bold text-slate-900 mb-6 leading-tight">
          Detect threats in your
          <span className="text-blue-600"> security logs</span>
          <br />
          in seconds
        </h1>
        <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Upload Nginx or ZScaler proxy logs. Get instant anomaly detection,
          AI-powered threat explanations, and SOC-ready dashboards.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => router.push(loggedIn ? '/history' : '/login')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold text-base transition-colors shadow-sm"
          >
            <Upload className="w-5 h-5" />
            {loggedIn ? 'Upload a Log File' : 'Get Started Free'}
            <ArrowRight className="w-4 h-4" />
          </button>
          {!loggedIn && (
            <button
              onClick={() => router.push('/login')}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl font-semibold text-base transition-colors border border-slate-200 shadow-sm"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-6 mt-16 max-w-2xl mx-auto">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {s.value}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features grid */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">
          Everything a SOC analyst needs
        </h2>
        <div className="grid grid-cols-3 gap-6">
          {features.map(f => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className={`inline-flex p-2.5 rounded-lg ${f.bg} mb-4`}
                >
                  <Icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">
                  {f.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to analyze your logs?
          </h2>
          <p className="text-blue-100 mb-8">
            Create a free account and upload your first log file in minutes.
          </p>
          <button
            onClick={() => router.push(loggedIn ? '/history' : '/login')}
            className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm"
          >
            {loggedIn ? 'Go to Dashboard' : 'Create Free Account'}
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-700">
              CyberLog Analyzer
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Built for SOC analysts · Powered by Claude AI
          </p>
        </div>
      </footer>
    </div>
  )
}
