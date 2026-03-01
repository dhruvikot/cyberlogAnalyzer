import { prisma } from '../../config/database'
import { detectLogType, getParser } from './index'
import { NormalizedEntry } from '../../types'
import { anomalyService } from '../anomaly'
import { claudeService } from '../ai'

// How many entries to insert per DB batch
const BATCH_SIZE = 500

export const processingService = {
  async processFile(fileId: string): Promise<void> {
    // Mark as processing immediately
    await prisma.logFile.update({
      where: { id: fileId },
      data: { status: 'processing' },
    })

    try {
      const logFile = await prisma.logFile.findUniqueOrThrow({
        where: { id: fileId },
      })

      // Step 1: Auto-detect log type
      console.log(`[${fileId}] Detecting log type...`)
      const logType = await detectLogType(logFile.filePath)

      await prisma.logFile.update({
        where: { id: fileId },
        data: { logType },
      })

      if (logType === 'unknown') {
        throw new Error(
          'Could not detect log type. Supported: nginx, zscaler CSV'
        )
      }

      console.log(`[${fileId}] Detected: ${logType}`)

      // Step 2: Get correct parser
      const parser = getParser(logType)
      if (!parser) throw new Error(`No parser for type: ${logType}`)

      // Step 3: Stream parse + batch insert
      let totalLines = 0
      let parsedLines = 0
      let batch: NormalizedEntry[] = []

      for await (const entry of parser.parse(logFile.filePath)) {
        totalLines++
        batch.push(entry)

        if (batch.length >= BATCH_SIZE) {
          await insertBatch(fileId, batch)
          parsedLines += batch.length
          batch = []

          // Update progress every batch
          await prisma.logFile.update({
            where: { id: fileId },
            data: { parsedLines, totalLines },
          })
        }
      }

      // Insert remaining entries
      if (batch.length > 0) {
        await insertBatch(fileId, batch)
        parsedLines += batch.length
        totalLines = parsedLines
      }

      console.log(`[${fileId}] Parsed ${parsedLines} entries`)

      // Step 4: Run anomaly detection
      const anomalies = await anomalyService.detectAnomalies(fileId, logType)

      // Step 5: AI enrichment (runs after detection, never blocks)
      // If Claude API fails, pipeline still completes successfully
      if (anomalies.length > 0) {
        await claudeService.explainAnomalies(fileId)
      }
      await claudeService.generateFileSummary(fileId)

      // Step 6: Mark complete
      await prisma.logFile.update({
        where: { id: fileId },
        data: {
          status: 'complete',
          totalLines,
          parsedLines,
          completedAt: new Date(),
        },
      })

      console.log(`[${fileId}] Processing complete`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[${fileId}] Processing failed:`, message)

      await prisma.logFile.update({
        where: { id: fileId },
        data: {
          status: 'failed',
          errorMessage: message,
        },
      })
    }
  },
}

async function insertBatch(
  fileId: string,
  entries: NormalizedEntry[]
): Promise<void> {
  await prisma.logEntry.createMany({
    data: entries.map(e => ({
      fileId,
      lineNumber:    e.lineNumber,
      timestamp:     e.timestamp,
      sourceIp:      e.sourceIp,
      userIdentity:  e.userIdentity,
      action:        e.action,
      target:        e.target,
      statusCode:    e.statusCode,
      bytesSent:     e.bytesSent,
      bytesReceived: e.bytesReceived,
      severity:      e.severity,
      rawLine:       e.rawLine,
      metadata:      e.metadata,
    })),
    skipDuplicates: true,
  })
}
