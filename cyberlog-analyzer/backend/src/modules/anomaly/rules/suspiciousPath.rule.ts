import { LogEntry } from '@prisma/client'
import { AnomalyResult, LogType } from '../../../types'
import { BaseRule } from './base.rule'

const SUSPICIOUS_PATTERNS = [
  { pattern: /\/\.env/i,          label: 'Environment file exposure',  severity: 'critical' as const },
  { pattern: /\/\.git/i,          label: 'Git repository exposure',     severity: 'high'     as const },
  { pattern: /\/wp-admin/i,       label: 'WordPress admin probe',       severity: 'medium'   as const },
  { pattern: /\/phpmyadmin/i,     label: 'phpMyAdmin probe',            severity: 'high'     as const },
  { pattern: /\/etc\/passwd/i,    label: 'Path traversal - passwd',     severity: 'critical' as const },
  { pattern: /\.\.\//,            label: 'Directory traversal attempt', severity: 'high'     as const },
  { pattern: /union.*select/i,    label: 'SQL injection attempt',       severity: 'critical' as const },
  { pattern: /<script/i,          label: 'XSS injection attempt',       severity: 'high'     as const },
  { pattern: /\/admin/i,          label: 'Admin panel probe',           severity: 'medium'   as const },
  { pattern: /cmd=|exec=|eval=/i, label: 'Remote code execution probe', severity: 'critical' as const },
]

export class SuspiciousPathRule extends BaseRule {
  readonly name = 'suspicious_path'
  readonly supportedTypes: LogType[] = ['nginx']

  evaluate(entries: LogEntry[], logType: LogType): AnomalyResult[] {
    const anomalies: AnomalyResult[] = []

    for (const entry of entries) {
      for (const { pattern, label, severity } of SUSPICIOUS_PATTERNS) {
        if (pattern.test(entry.target)) {
          anomalies.push({
            entryId: entry.id,
            ruleName: this.name,
            severity,
            confidence: 0.95,
            reason: `${label}: request to "${entry.target}" from IP ${entry.sourceIp ?? 'unknown'}`,
            context: {
              ip: entry.sourceIp,
              path: entry.target,
              pattern: label,
              statusCode: entry.statusCode,
              timestamp: entry.timestamp,
            },
          })
          // Only flag each entry once (first match wins)
          break
        }
      }
    }

    return anomalies
  }
}
