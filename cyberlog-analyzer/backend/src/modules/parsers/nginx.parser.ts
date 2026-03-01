import fs from 'fs'
import readline from 'readline'
import { NormalizedEntry } from '../../types'
import { BaseParser } from './base.parser'

export class NginxParser extends BaseParser {
  readonly logType = 'nginx' as const

  // Nginx combined log format regex
  private readonly NGINX_REGEX =
    /^(\S+)\s+\S+\s+(\S+)\s+\[([^\]]+)\]\s+"(\S+)\s+(\S+)\s+\S+"\s+(\d{3})\s+(\d+)(?:\s+"([^"]*)"\s+"([^"]*)")?/

  detect(sampleLines: string[]): number {
    const matches = sampleLines.filter(
      line => line.trim() && this.NGINX_REGEX.test(line)
    )
    return sampleLines.length > 0 ? matches.length / sampleLines.length : 0
  }

  async *parse(filePath: string): AsyncGenerator<NormalizedEntry> {
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' })
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    })

    let lineNumber = 0

    for await (const line of rl) {
      lineNumber++
      if (!line.trim()) continue
      const entry = this.parseLine(line, lineNumber)
      if (entry) yield entry
    }
  }

  private parseLine(line: string, lineNumber: number): NormalizedEntry | null {
    const match = this.NGINX_REGEX.exec(line)
    if (!match) return null

    const [, sourceIp, user, timeStr, method, path, status, bytes, , userAgent] = match

    const statusCode = parseInt(status, 10)
    const bytesSent = BigInt(bytes || '0')
    const timestamp = this.parseTimestamp(timeStr)

    let severity: NormalizedEntry['severity'] = this.severityFromStatus(statusCode)

    // Upgrade severity for suspicious paths
    const suspiciousPaths = [
      '/.env', '/.git', '/wp-admin', '/phpmyadmin',
      '/admin', '/.ssh', '/etc/passwd',
    ]
    if (suspiciousPaths.some(p => path.toLowerCase().includes(p))) {
      severity = 'high'
    }

    return {
      lineNumber,
      timestamp,
      sourceIp,
      userIdentity: user === '-' ? null : user,
      action: method,
      target: path,
      statusCode,
      bytesSent,
      bytesReceived: null,
      severity,
      rawLine: line,
      metadata: {
        userAgent: userAgent ?? null,
        bytesSent: bytes,
        protocol: 'HTTP',
      },
    }
  }
}
