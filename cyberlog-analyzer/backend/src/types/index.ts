export type LogType = 'nginx' | 'zscaler' | 'unknown'
export type FileStatus = 'uploaded' | 'processing' | 'complete' | 'failed'
export type Severity = 'low' | 'medium' | 'high' | 'critical'

export interface NormalizedEntry {
  lineNumber: number
  timestamp: Date
  sourceIp: string | null
  userIdentity: string | null
  action: string
  target: string
  statusCode: number | null
  bytesSent: bigint | null
  bytesReceived: bigint | null
  severity: Severity
  rawLine: string
  metadata: Record<string, unknown>
}

export interface AnomalyResult {
  entryId?: string
  ruleName: string
  severity: Severity
  confidence: number   // 0.0 to 1.0
  reason: string
  context: Record<string, unknown>
}

export interface AIEnrichedAnomaly extends AnomalyResult {
  aiExplanation?: string
  aiThreatCategory?: string
  aiMitreTechnique?: string
  aiAction?: string
}

export interface JwtPayload {
  userId: string
  email: string
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}
