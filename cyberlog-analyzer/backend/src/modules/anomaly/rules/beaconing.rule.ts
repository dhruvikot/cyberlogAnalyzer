import { LogEntry } from '@prisma/client'
import { AnomalyResult, LogType } from '../../../types'
import { BaseRule } from './base.rule'

const MIN_REQUESTS = 20  // need enough data points
const MAX_CV = 0.1       // coefficient of variation threshold

export class BeaconingRule extends BaseRule {
  readonly name = 'beaconing'
  readonly supportedTypes: LogType[] = ['zscaler']

  evaluate(entries: LogEntry[], logType: LogType): AnomalyResult[] {
    const anomalies: AnomalyResult[] = []

    // Group by (sourceIp, domain)
    const groups = new Map<string, LogEntry[]>()

    for (const entry of entries) {
      if (!entry.sourceIp) continue

      const domain = extractDomain(entry.target)
      if (!domain) continue

      const key = `${entry.sourceIp}::${domain}`
      const group = groups.get(key) ?? []
      group.push(entry)
      groups.set(key, group)
    }

    for (const [key, group] of groups) {
      if (group.length < MIN_REQUESTS) continue

      // Sort by timestamp
      group.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

      // Calculate intervals between consecutive requests (seconds)
      const intervals: number[] = []
      for (let i = 1; i < group.length; i++) {
        const diff =
          (group[i].timestamp.getTime() - group[i - 1].timestamp.getTime()) /
          1000
        // Ignore gaps > 1hr (not consistent beaconing)
        if (diff > 0 && diff < 3600) intervals.push(diff)
      }

      if (intervals.length < MIN_REQUESTS - 1) continue

      const avg = this.mean(intervals)
      const sd = this.stddev(intervals, avg)

      // Coefficient of Variation: lower = more regular = more suspicious
      const cv = avg > 0 ? sd / avg : 1
      if (cv >= MAX_CV) continue

      const confidence = Math.min(0.99, 1 - cv)
      const [ip, domain] = key.split('::')

      anomalies.push({
        entryId: group[0].id,
        ruleName: this.name,
        severity: 'critical',
        confidence,
        reason: `Beaconing detected: ${ip} made ${group.length} requests to ${domain} at regular ${Math.round(avg)}s intervals (±${Math.round(sd)}s) — consistent with C2 malware check-in`,
        context: {
          ip,
          domain,
          requestCount: group.length,
          avgIntervalSeconds: Math.round(avg),
          stddevSeconds: Math.round(sd),
          coefficientOfVariation: Math.round(cv * 1000) / 1000,
          firstSeen: group[0].timestamp,
          lastSeen: group[group.length - 1].timestamp,
        },
      })
    }

    return anomalies
  }
}

function extractDomain(url: string): string | null {
  try {
    const withProtocol = url.startsWith('http') ? url : `https://${url}`
    return new URL(withProtocol).hostname
  } catch {
    return null
  }
}
