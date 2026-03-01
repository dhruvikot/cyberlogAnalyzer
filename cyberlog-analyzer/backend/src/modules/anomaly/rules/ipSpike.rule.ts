import { LogEntry } from '@prisma/client'
import { AnomalyResult, LogType } from '../../../types'
import { BaseRule } from './base.rule'

const WINDOW_MS = 5 * 60 * 1000  // 5-minute windows
const MIN_Z_SCORE = 2.5
const MIN_REQUESTS = 20

export class IpSpikeRule extends BaseRule {
  readonly name = 'ip_request_spike'
  readonly supportedTypes: LogType[] = ['nginx', 'zscaler']

  evaluate(entries: LogEntry[], logType: LogType): AnomalyResult[] {
    const anomalies: AnomalyResult[] = []

    // Group entries by (sourceIp, 5-min window)
    const windowCounts = new Map<string, {
      ip: string
      windowStart: Date
      count: number
      entryId: string
    }>()

    for (const entry of entries) {
      if (!entry.sourceIp) continue

      const bucketMs =
        Math.floor(entry.timestamp.getTime() / WINDOW_MS) * WINDOW_MS
      const key = `${entry.sourceIp}::${bucketMs}`

      const existing = windowCounts.get(key)
      if (existing) {
        existing.count++
      } else {
        windowCounts.set(key, {
          ip: entry.sourceIp,
          windowStart: new Date(bucketMs),
          count: 1,
          entryId: entry.id,
        })
      }
    }

    // Compute baseline across all windows
    const allCounts = Array.from(windowCounts.values()).map(w => w.count)
    const avg = this.mean(allCounts)
    const sd = this.stddev(allCounts, avg)

    for (const window of windowCounts.values()) {
      if (window.count < MIN_REQUESTS) continue

      const zScore = sd > 0 ? (window.count - avg) / sd : 0
      if (zScore < MIN_Z_SCORE) continue

      const confidence = this.zScoreToConfidence(zScore)

      anomalies.push({
        entryId: window.entryId,
        ruleName: this.name,
        severity: zScore > 5 ? 'critical' : 'high',
        confidence,
        reason: `IP ${window.ip} made ${window.count} requests in a 5-minute window (${Math.round(zScore)}x above baseline of ${Math.round(avg)})`,
        context: {
          ip: window.ip,
          windowStart: window.windowStart,
          requestCount: window.count,
          baseline: Math.round(avg),
          zScore: Math.round(zScore * 10) / 10,
        },
      })
    }

    return anomalies
  }
}
