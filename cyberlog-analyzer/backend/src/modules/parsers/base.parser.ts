import { NormalizedEntry, LogType } from '../../types'

export abstract class BaseParser {
  abstract readonly logType: LogType

  // Look at sample lines and return confidence 0..1
  abstract detect(sampleLines: string[]): number

  // Parse entire file, yield entries one at a time
  // Async generator = memory efficient for large files
  abstract parse(filePath: string): AsyncGenerator<NormalizedEntry>

  // Shared utility: parse common timestamp formats
  protected parseTimestamp(raw: string): Date {
    const date = new Date(raw)
    if (!isNaN(date.getTime())) return date

    // Try nginx format: 10/Oct/2000:13:55:36 -0700
    const nginxMatch = raw.match(
      /(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})\s([+-]\d{4})/
    )
    if (nginxMatch) {
      const months: Record<string, string> = {
        Jan: '01', Feb: '02', Mar: '03', Apr: '04',
        May: '05', Jun: '06', Jul: '07', Aug: '08',
        Sep: '09', Oct: '10', Nov: '11', Dec: '12',
      }
      const [, day, mon, year, hh, mm, ss, tz] = nginxMatch
      return new Date(
        `${year}-${months[mon]}-${day}T${hh}:${mm}:${ss}${tz}`
      )
    }

    // Fallback to now if unparseable
    return new Date()
  }

  // Shared utility: extract IPv4 from string
  protected extractIp(raw: string): string | null {
    const match = raw.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/)
    return match ? match[1] : null
  }

  // Shared utility: determine severity from HTTP status code
  protected severityFromStatus(
    statusCode: number | null
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (!statusCode) return 'low'
    if (statusCode >= 500) return 'high'
    if (statusCode >= 400) return 'medium'
    return 'low'
  }
}
