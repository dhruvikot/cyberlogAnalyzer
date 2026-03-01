import fs from 'fs'
import readline from 'readline'
import { LogType } from '../../types'
import { NginxParser } from './nginx.parser'
import { ZScalerParser } from './zscaler.parser'
import { BaseParser } from './base.parser'

// All registered parsers
const PARSERS: BaseParser[] = [
  new NginxParser(),
  new ZScalerParser(),
]

// Minimum confidence to claim a log type
const CONFIDENCE_THRESHOLD = 0.7

export async function detectLogType(filePath: string): Promise<LogType> {
  const sampleLines = await readSampleLines(filePath, 20)

  if (sampleLines.length === 0) return 'unknown'

  const scores = PARSERS.map(parser => ({
    logType: parser.logType,
    confidence: parser.detect(sampleLines),
  }))

  scores.sort((a, b) => b.confidence - a.confidence)

  console.log('Detection scores:', scores)

  const best = scores[0]
  return best.confidence >= CONFIDENCE_THRESHOLD ? best.logType : 'unknown'
}

async function readSampleLines(
  filePath: string,
  count: number
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const lines: string[] = []
    const stream = fs.createReadStream(filePath, { encoding: 'utf8' })
    const rl = readline.createInterface({ input: stream })

    rl.on('line', line => {
      if (line.trim()) lines.push(line)
      if (lines.length >= count) {
        rl.close()
        stream.destroy()
      }
    })

    rl.on('close', () => resolve(lines))
    rl.on('error', reject)
    stream.on('error', reject)
  })
}
