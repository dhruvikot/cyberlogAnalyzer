import { LogEntry } from '@prisma/client'
import { AnomalyResult, LogType } from '../../../types'
import { BaseRule } from './base.rule'

const MIN_BYTES = 10 * 1024 * 1024  // ignore transfers under 10MB
const MULTIPLIER = 3                 // flag if > 3x p95

export class DataExfilRule extends BaseRule {
  readonly name = 'data_exfiltration'
  readonly supportedTypes: LogType[] = ['zscaler']

  evaluate(entries: LogEntry[], logType: LogType): AnomalyResult[] {
    const anomalies: AnomalyResult[] = []

    const bytesValues = entries
      .map(e => Number(e.bytesSent ?? 0))
      .filter(b => b > 0)
      .sort((a, b) => a - b)

    if (bytesValues.length === 0) return []

    const p95 = this.percentile(bytesValues, 95)
    const threshold = Math.max(p95 * MULTIPLIER, MIN_BYTES)

    for (const entry of entries) {
      const bytes = Number(entry.bytesSent ?? 0)
      if (bytes < threshold) continue

      const ratio = Math.round(bytes / (p95 || 1))
      const confidence = Math.min(0.99, 0.7 + (bytes / threshold - 1) * 0.1)

      anomalies.push({
        entryId: entry.id,
        ruleName: this.name,
        severity: bytes > 100 * 1024 * 1024 ? 'critical' : 'high',
        confidence,
        reason: `Unusual outbound transfer: ${formatBytes(bytes)} sent to ${entry.target} (${ratio}x above p95 baseline of ${formatBytes(p95)})`,
        context: {
          ip: entry.sourceIp,
          user: entry.userIdentity,
          target: entry.target,
          bytesSent: bytes,
          p95Baseline: p95,
          ratio,
          timestamp: entry.timestamp,
        },
      })
    }

    return anomalies
  }
}

function formatBytes(bytes: number): string {
  if (bytes > 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`
  if (bytes > 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${bytes}B`
}
