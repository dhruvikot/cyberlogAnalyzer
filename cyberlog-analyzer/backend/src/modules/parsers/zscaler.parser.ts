import fs from 'fs'
import readline from 'readline'
import { NormalizedEntry } from '../../types'
import { BaseParser } from './base.parser'

export class ZScalerParser extends BaseParser {
  readonly logType = 'zscaler' as const

  private readonly EXPECTED_HEADERS = [
    'timestamp', 'user', 'src_ip', 'url',
    'action', 'category', 'bytes_sent',
    'bytes_received', 'user_agent', 'threat_name',
  ]

  detect(sampleLines: string[]): number {
    if (sampleLines.length === 0) return 0

    const firstLine = sampleLines[0].toLowerCase().trim()

    // Strong signal: header row matches expected columns
    const hasHeader = this.EXPECTED_HEADERS.every(h => firstLine.includes(h))
    if (hasHeader) return 0.99

    // Weaker signal: looks like CSV with enough columns
    const csvLines = sampleLines.filter(l => l.split(',').length >= 8)
    return (csvLines.length / sampleLines.length) * 0.6
  }

  async *parse(filePath: string): AsyncGenerator<NormalizedEntry> {
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' })
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    })

    let lineNumber = 0
    let isFirstLine = true

    for await (const line of rl) {
      lineNumber++
      if (!line.trim()) continue

      // Skip header row
      if (isFirstLine) {
        isFirstLine = false
        if (line.toLowerCase().includes('timestamp')) continue
      }

      const entry = this.parseLine(line, lineNumber)
      if (entry) yield entry
    }
  }

  private parseLine(line: string, lineNumber: number): NormalizedEntry | null {
    const cols = this.parseCSVLine(line)
    if (cols.length < 8) return null

    const [
      timestampRaw,
      user,
      srcIp,
      url,
      action,
      category,
      bytesSentRaw,
      bytesReceivedRaw,
      userAgent,
      threatName,
    ] = cols

    const timestamp = this.parseTimestamp(timestampRaw.trim())
    const bytesSent = BigInt(parseInt(bytesSentRaw?.trim() || '0') || 0)
    const bytesReceived = BigInt(parseInt(bytesReceivedRaw?.trim() || '0') || 0)
    const actionClean = action?.trim().toUpperCase() || 'UNKNOWN'

    let severity: NormalizedEntry['severity'] = 'low'
    if (actionClean === 'BLOCK' || actionClean === 'BLOCKED') severity = 'medium'
    if (threatName?.trim()) severity = 'high'

    return {
      lineNumber,
      timestamp,
      sourceIp: srcIp?.trim() || null,
      userIdentity: user?.trim() || null,
      action: actionClean,
      target: url?.trim() || '',
      statusCode: null,
      bytesSent,
      bytesReceived,
      severity,
      rawLine: line,
      metadata: {
        category: category?.trim() ?? null,
        userAgent: userAgent?.trim() ?? null,
        threatName: threatName?.trim() || null,
        protocol: 'HTTPS',
      },
    }
  }

  // Properly parse CSV line handling quoted fields
  private parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    result.push(current)
    return result
  }
}
