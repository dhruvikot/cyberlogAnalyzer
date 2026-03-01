import { LogEntry } from '@prisma/client'
import { AnomalyResult, LogType } from '../../../types'
import { BaseRule } from './base.rule'

const WINDOW_MS = 10 * 60 * 1000  // 10-minute window
const THRESHOLD = 20               // min failed attempts to flag

export class BruteForceRule extends BaseRule {
  readonly name = 'brute_force'
  readonly supportedTypes: LogType[] = ['nginx']

  evaluate(entries: LogEntry[], logType: LogType): AnomalyResult[] {
    const anomalies: AnomalyResult[] = []

    // Only look at auth-related endpoints
    const authEntries = entries.filter(e =>
      e.target.includes('login') ||
      e.target.includes('auth') ||
      e.target.includes('signin') ||
      e.target.includes('password')
    )

    if (authEntries.length === 0) return []

    // Group failures by (ip, 10-min window)
    const windows = new Map<string, {
      ip: string
      failures: LogEntry[]
      windowStart: Date
    }>()

    for (const entry of authEntries) {
      if (!entry.sourceIp) continue
      const isFailure = entry.statusCode === 401 || entry.statusCode === 403
      if (!isFailure) continue

      const bucketMs =
        Math.floor(entry.timestamp.getTime() / WINDOW_MS) * WINDOW_MS
      const key = `${entry.sourceIp}::${bucketMs}`

      const existing = windows.get(key)
      if (existing) {
        existing.failures.push(entry)
      } else {
        windows.set(key, {
          ip: entry.sourceIp,
          failures: [entry],
          windowStart: new Date(bucketMs),
        })
      }
    }

    for (const window of windows.values()) {
      if (window.failures.length < THRESHOLD) continue

      // Check if a successful login follows the failures (within 2x window)
      const windowEnd = new Date(
        window.windowStart.getTime() + WINDOW_MS * 2
      )
      const successAfter = authEntries.find(
        e =>
          e.sourceIp === window.ip &&
          e.statusCode === 200 &&
          e.timestamp > window.windowStart &&
          e.timestamp < windowEnd
      )

      const confidence = Math.min(
        0.99,
        0.7 + (window.failures.length / 100) * 0.29
      )
      const severity = successAfter ? 'critical' : 'high'
      const successMsg = successAfter
        ? ` Successful login detected at ${successAfter.timestamp.toISOString()} — account may be compromised.`
        : ''

      anomalies.push({
        entryId: window.failures[0].id,
        ruleName: this.name,
        severity,
        confidence,
        reason: `Brute force attack: IP ${window.ip} made ${window.failures.length} failed login attempts in 10 minutes.${successMsg}`,
        context: {
          ip: window.ip,
          failedAttempts: window.failures.length,
          windowStart: window.windowStart,
          successfulLoginAfter: successAfter?.timestamp ?? null,
          accountCompromised: !!successAfter,
          targetEndpoints: [...new Set(window.failures.map(e => e.target))],
        },
      })
    }

    return anomalies
  }
}
