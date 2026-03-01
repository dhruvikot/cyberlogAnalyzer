import { prisma } from '../../config/database'
import { LogType, AnomalyResult } from '../../types'
import { BaseRule } from './rules/base.rule'
import { IpSpikeRule } from './rules/ipSpike.rule'
import { SuspiciousPathRule } from './rules/suspiciousPath.rule'
import { DataExfilRule } from './rules/dataExfil.rule'
import { BeaconingRule } from './rules/beaconing.rule'
import { BruteForceRule } from './rules/bruteForce.rule'

const RULES: BaseRule[] = [
  new IpSpikeRule(),
  new SuspiciousPathRule(),
  new DataExfilRule(),
  new BeaconingRule(),
  new BruteForceRule(),
]

export const anomalyService = {
  async detectAnomalies(
    fileId: string,
    logType: LogType
  ): Promise<AnomalyResult[]> {
    console.log(`[${fileId}] Running anomaly detection (${logType})...`)

    // Load all entries for this file
    const entries = await prisma.logEntry.findMany({
      where: { fileId },
      orderBy: { timestamp: 'asc' },
    })

    if (entries.length === 0) return []

    const allAnomalies: AnomalyResult[] = []

    for (const rule of RULES) {
      if (!rule.appliesTo(logType)) continue

      try {
        console.log(`[${fileId}] Running rule: ${rule.name}`)
        const results = rule.evaluate(entries, logType)
        console.log(
          `[${fileId}] Rule ${rule.name}: ${results.length} anomalies found`
        )
        allAnomalies.push(...results)
      } catch (error) {
        // One rule failing should not stop others
        console.error(`[${fileId}] Rule ${rule.name} failed:`, error)
      }
    }

    // Deduplicate: same entryId + same rule = keep highest confidence
    const deduped = deduplicateAnomalies(allAnomalies)

    if (deduped.length > 0) {
      await prisma.anomaly.createMany({
        data: deduped.map(a => ({
          fileId,
          entryId:    a.entryId ?? null,
          ruleName:   a.ruleName,
          severity:   a.severity,
          confidence: a.confidence,
          reason:     a.reason,
          context:    a.context,
        })),
        skipDuplicates: true,
      })
    }

    console.log(
      `[${fileId}] Anomaly detection complete: ${deduped.length} total anomalies`
    )
    return deduped
  },
}

function deduplicateAnomalies(anomalies: AnomalyResult[]): AnomalyResult[] {
  const map = new Map<string, AnomalyResult>()

  for (const a of anomalies) {
    const key = `${a.entryId ?? 'group'}::${a.ruleName}`
    const existing = map.get(key)
    if (!existing || a.confidence > existing.confidence) {
      map.set(key, a)
    }
  }

  return Array.from(map.values())
}
