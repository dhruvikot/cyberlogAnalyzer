import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '../../config/database'
import { env } from '../../config/env'

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
})

// Haiku: fast, cheap, perfect for structured JSON output
const MODEL = 'claude-haiku-4-5-20251001'

// Claude sometimes wraps JSON in markdown fences despite instructions.
// Strip them before parsing.
function parseJson<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  return JSON.parse(cleaned) as T
}

// Max anomalies per Claude call — keep low to avoid truncation
const BATCH_SIZE = 10

interface AnomalyExplanation {
  anomalyId: string
  explanation: string
  threatCategory: string
  mitreTechnique: string | null
  recommendedAction: string
  confidenceAdjustment: number
}

interface FileSummary {
  summary: string
}

export const claudeService = {
  // Explain anomalies in plain English + MITRE mapping
  // Takes detected anomalies, enriches each with AI fields
  async explainAnomalies(fileId: string): Promise<void> {
    // Load anomalies that don't have AI explanation yet
    const anomalies = await prisma.anomaly.findMany({
      where: {
        fileId,
        aiExplanation: null,
      },
      include: {
        entry: {
          select: {
            timestamp: true,
            sourceIp: true,
            target: true,
            action: true,
            statusCode: true,
            bytesSent: true,
          },
        },
      },
      orderBy: { confidence: 'desc' },
      take: BATCH_SIZE,
    })

    if (anomalies.length === 0) return

    console.log(
      `[AI] Explaining ${anomalies.length} anomalies for file ${fileId}`
    )

    const anomalyPayload = anomalies.map(a => ({
      id: a.id,
      ruleName: a.ruleName,
      severity: a.severity,
      confidence: a.confidence,
      reason: a.reason,
      context: a.context,
      entry: a.entry
        ? {
            timestamp: a.entry.timestamp,
            sourceIp: a.entry.sourceIp,
            target: a.entry.target,
            action: a.entry.action,
            statusCode: a.entry.statusCode,
            bytesSent: a.entry.bytesSent?.toString(),
          }
        : null,
    }))

    const prompt = `You are a senior SOC analyst assistant reviewing anomalies \
detected in security logs. For each anomaly provide a clear explanation.

IMPORTANT: Respond ONLY with a valid JSON array. No markdown, no code blocks, \
no explanation outside the JSON.

For each anomaly return an object with exactly these fields:
{
  "anomalyId": "<the id field from input>",
  "explanation": "<2 sentences max, plain English for a junior analyst>",
  "threatCategory": "<one of: C2 Beaconing, Data Exfiltration, Brute Force, Reconnaissance, Credential Stuffing, Path Traversal, SQL Injection, XSS, Suspicious Scanning, Anomalous Traffic>",
  "mitreTechnique": "<ATT&CK ID and name e.g. T1071.001 - Web Protocols, or null if not applicable>",
  "recommendedAction": "<one concrete immediate action, max 15 words>",
  "confidenceAdjustment": <number between -0.1 and 0.1>
}

Anomalies to analyze:
${JSON.stringify(anomalyPayload, null, 2)}

Respond with JSON array only. No other text.`

    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      })

      const content = response.content[0]
      if (content.type !== 'text') return

      // Check if response was truncated before parsing
      if (response.stop_reason === 'max_tokens') {
        console.warn('[AI] Response truncated — reduce BATCH_SIZE or increase max_tokens')
        return
      }

      const explanations = parseJson<AnomalyExplanation[]>(content.text)

      // Update each anomaly with AI enrichment
      await Promise.all(
        explanations.map(e =>
          prisma.anomaly.update({
            where: { id: e.anomalyId },
            data: {
              aiExplanation:    e.explanation,
              aiThreatCategory: e.threatCategory,
              aiMitreTechnique: e.mitreTechnique,
              aiAction:         e.recommendedAction,
              // Adjust confidence within bounds 0.1..0.99
              confidence: Math.min(
                0.99,
                Math.max(
                  0.1,
                  (anomalies.find(a => a.id === e.anomalyId)?.confidence ?? 0.5) +
                    (e.confidenceAdjustment ?? 0)
                )
              ),
            },
          })
        )
      )

      console.log(
        `[AI] Successfully enriched ${explanations.length} anomalies`
      )
    } catch (error) {
      // AI failure must never crash the pipeline —
      // anomalies are still useful without AI explanation
      console.error('[AI] Failed to explain anomalies:', error)
    }
  },

  // Generate 3-sentence executive summary for the whole file
  async generateFileSummary(fileId: string): Promise<void> {
    const [file, anomalies, entryCount] = await Promise.all([
      prisma.logFile.findUnique({
        where: { id: fileId },
        select: {
          originalName: true,
          logType: true,
          totalLines: true,
        },
      }),
      prisma.anomaly.findMany({
        where: { fileId },
        orderBy: { confidence: 'desc' },
        take: 5,
        select: {
          ruleName: true,
          severity: true,
          confidence: true,
          reason: true,
          aiThreatCategory: true,
        },
      }),
      prisma.logEntry.count({ where: { fileId } }),
    ])

    if (!file) return

    const criticalCount = anomalies.filter(a => a.severity === 'critical').length
    const highCount = anomalies.filter(a => a.severity === 'high').length

    const prompt = `You are a SOC analyst writing a brief for a security manager.
Write a 3-sentence executive summary of this log file analysis.

Be specific, use the actual IPs/domains/numbers from the data.
Write in past tense. Be direct - no fluff.

Log file: ${file.originalName} (${file.logType} format)
Total events analyzed: ${entryCount}
Total anomalies detected: ${anomalies.length}
Critical severity: ${criticalCount}
High severity: ${highCount}

Top anomalies found:
${JSON.stringify(anomalies, null, 2)}

Respond with ONLY a JSON object:
{
  "summary": "<exactly 3 sentences, plain English, specific details>"
}

No other text.`

    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      })

      const content = response.content[0]
      if (content.type !== 'text') return

      const result = parseJson<FileSummary>(content.text)

      await prisma.logFile.update({
        where: { id: fileId },
        data: { aiSummary: result.summary },
      })

      console.log(`[AI] Summary generated for file ${fileId}`)
    } catch (error) {
      console.error('[AI] Failed to generate summary:', error)
    }
  },
}
