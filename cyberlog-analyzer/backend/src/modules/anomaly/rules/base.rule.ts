import { LogEntry } from '@prisma/client'
import { AnomalyResult, LogType } from '../../../types'

export abstract class BaseRule {
  // Name stored in DB — must be snake_case
  abstract readonly name: string

  // Which log types this rule applies to
  abstract readonly supportedTypes: LogType[]

  // Evaluate all entries and return anomalies found
  abstract evaluate(
    entries: LogEntry[],
    logType: LogType
  ): AnomalyResult[]

  appliesTo(logType: LogType): boolean {
    return this.supportedTypes.includes(logType)
  }

  // Map z-score to confidence 0..1
  // z=2.5 → ~0.7, z=5 → ~0.95
  protected zScoreToConfidence(zScore: number): number {
    const confidence = 1 - 1 / (1 + Math.pow(zScore / 3, 2))
    return Math.min(0.99, Math.max(0.5, confidence))
  }

  protected mean(values: number[]): number {
    if (values.length === 0) return 0
    return values.reduce((sum, v) => sum + v, 0) / values.length
  }

  protected stddev(values: number[], meanVal?: number): number {
    if (values.length < 2) return 0
    const m = meanVal ?? this.mean(values)
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / values.length
    return Math.sqrt(variance)
  }

  protected percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0
    const index = Math.floor((p / 100) * sortedValues.length)
    return sortedValues[Math.min(index, sortedValues.length - 1)]
  }
}
