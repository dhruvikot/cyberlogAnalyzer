export type LogType = 'nginx' | 'zscaler' | 'unknown'
export type FileStatus = 'uploaded' | 'processing' | 'complete' | 'failed'
export type Severity = 'low' | 'medium' | 'high' | 'critical'

export interface User {
  id: string
  email: string
  name?: string
  createdAt: string
}

export interface UploadSession {
  id: string
  name: string
  createdAt: string
  logFiles: LogFile[]
}

export interface LogFile {
  id: string
  originalName: string
  logType: LogType
  status: FileStatus
  totalLines: number | null
  parsedLines: number | null
  errorMessage: string | null
  aiSummary: string | null
  createdAt: string
  completedAt: string | null
  sessionId: string
}

export interface LogEntry {
  id: string
  lineNumber: number
  timestamp: string
  sourceIp: string | null
  userIdentity: string | null
  action: string
  target: string
  statusCode: number | null
  bytesSent: string | null
  bytesReceived: string | null
  severity: Severity
  rawLine: string
  isAnomalous: boolean
  anomalies: AnomalySummary[]
}

export interface AnomalySummary {
  id: string
  ruleName: string
  severity: Severity
  confidence: number
  reason: string
}

export interface Anomaly {
  id: string
  fileId: string
  entryId: string | null
  ruleName: string
  severity: Severity
  confidence: number
  reason: string
  context: Record<string, unknown>
  aiExplanation: string | null
  aiThreatCategory: string | null
  aiMitreTechnique: string | null
  aiAction: string | null
  detectedAt: string
  entry: {
    timestamp: string
    sourceIp: string | null
    target: string
    action: string
    rawLine: string
  } | null
}

export interface Analysis {
  kpis: {
    totalEvents: number
    uniqueIps: number
    blockedEvents: number
    anomalyCount: number
  }
  topIps?: { ip: string; count: number }[]
  topIPs?: { ip: string; count: number }[]
  topTargets: { target: string; count: number }[]
  timeline: { bucket: string; count: number; highCount: number }[]
}

export interface Correlation {
  sourceIp: string
  seenIn: string[]
  rulesTriggered: string[]
  maxConfidence: number
  totalAnomalies: number
  narrative: string
}
