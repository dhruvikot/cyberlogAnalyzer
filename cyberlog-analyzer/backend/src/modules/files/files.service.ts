import { prisma } from '../../config/database'
import { AppError } from '../../middleware/error.middleware'

export const filesService = {
  // Create file record in DB after multer saves to disk
  async createFileRecord(data: {
    sessionId: string
    userId: string
    originalName: string
    filePath: string
  }) {
    return prisma.logFile.create({
      data: {
        ...data,
        logType: 'unknown',  // will be updated after detection
        status: 'uploaded',  // will move to processing → complete
      },
    })
  },

  // Get file metadata + status (used for polling)
  async getFile(fileId: string, userId: string) {
    const file = await prisma.logFile.findFirst({
      where: { id: fileId, userId },
      select: {
        id: true,
        originalName: true,
        logType: true,
        status: true,
        totalLines: true,
        parsedLines: true,
        errorMessage: true,
        aiSummary: true,
        createdAt: true,
        completedAt: true,
        sessionId: true,
      },
    })

    if (!file) throw new AppError(404, 'File not found')
    return file
  },

  // Paginated entries with filters
  async getEntries(
    fileId: string,
    userId: string,
    options: {
      page: number
      limit: number
      ip?: string
      severity?: string
      from?: string
      to?: string
    }
  ) {
    // Verify file belongs to user
    const file = await prisma.logFile.findFirst({
      where: { id: fileId, userId },
    })
    if (!file) throw new AppError(404, 'File not found')

    const { page, limit, ip, severity, from, to } = options
    const skip = (page - 1) * limit

    // Build dynamic where clause
    const where: any = { fileId }
    if (ip) where.sourceIp = { contains: ip }
    if (severity) where.severity = severity
    if (from || to) {
      where.timestamp = {}
      if (from) where.timestamp.gte = new Date(from)
      if (to) where.timestamp.lte = new Date(to)
    }

    const [entries, total] = await Promise.all([
      prisma.logEntry.findMany({
        where,
        orderBy: { timestamp: 'asc' },
        skip,
        take: limit,
        select: {
          id: true,
          lineNumber: true,
          timestamp: true,
          sourceIp: true,
          userIdentity: true,
          action: true,
          target: true,
          statusCode: true,
          bytesSent: true,
          bytesReceived: true,
          severity: true,
          rawLine: true,
          // Check if this entry has anomalies (for highlighting)
          anomalies: {
            select: {
              id: true,
              ruleName: true,
              severity: true,
              confidence: true,
              reason: true,
            },
          },
        },
      }),
      prisma.logEntry.count({ where }),
    ])

    return {
      entries: entries.map(e => ({
        ...e,
        bytesSent: e.bytesSent?.toString() ?? null,
        bytesReceived: e.bytesReceived?.toString() ?? null,
        isAnomalous: e.anomalies.length > 0,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  // KPI aggregations + timeline for dashboard
  async getAnalysis(fileId: string, userId: string) {
    const file = await prisma.logFile.findFirst({
      where: { id: fileId, userId },
    })
    if (!file) throw new AppError(404, 'File not found')
    if (file.status !== 'complete') {
      throw new AppError(400, `File is still ${file.status}`)
    }

    // Run all aggregations in parallel for speed
    const [
      totalEvents,
      uniqueIps,
      blockedEvents,
      anomalyCount,
      topIps,
      topTargets,
      timelineRaw,
    ] = await Promise.all([
      // Total events
      prisma.logEntry.count({ where: { fileId } }),

      // Unique source IPs
      prisma.logEntry.groupBy({
        by: ['sourceIp'],
        where: { fileId, sourceIp: { not: null } },
      }).then(r => r.length),

      // Blocked or error events
      prisma.logEntry.count({
        where: {
          fileId,
          OR: [
            { action: { in: ['BLOCK', 'BLOCKED', 'DENY'] } },
            { statusCode: { gte: 400 } },
          ],
        },
      }),

      // Total anomalies
      prisma.anomaly.count({ where: { fileId } }),

      // Top 10 IPs by request count
      prisma.logEntry.groupBy({
        by: ['sourceIp'],
        where: { fileId, sourceIp: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // Top 10 targets
      prisma.logEntry.groupBy({
        by: ['target'],
        where: { fileId },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // Timeline: events per 5-minute bucket
      prisma.$queryRaw<any[]>`
        SELECT 
          date_trunc('hour', timestamp) + 
          INTERVAL '5 min' * FLOOR(EXTRACT(MINUTE FROM timestamp) / 5) AS bucket,
          COUNT(*)::int as count,
          COUNT(CASE WHEN severity = 'high' OR severity = 'critical' THEN 1 END)::int as high_count
        FROM "LogEntry"
        WHERE "fileId" = ${fileId}
        GROUP BY bucket
        ORDER BY bucket ASC
      `,
    ])

    return {
      kpis: {
        totalEvents,
        uniqueIps,
        blockedEvents,
        anomalyCount,
      },
      topIps: topIps.map(r => ({
        ip: r.sourceIp,
        count: r._count.id,
      })),
      topTargets: topTargets.map(r => ({
        target: r.target,
        count: r._count.id,
      })),
      timeline: timelineRaw.map(r => ({
        bucket: r.bucket,
        count: r.count,
        highCount: r.high_count,
      })),
    }
  },

  async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await prisma.logFile.findFirst({
      where: { id: fileId, userId },
    })
    if (!file) throw new AppError(404, 'File not found')

    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      const dir = path.dirname(file.filePath)
      await fs.rm(dir, { recursive: true, force: true })
    } catch (e) {
      console.warn('Could not delete file from disk:', e)
    }

    await prisma.logFile.delete({ where: { id: fileId } })
  },

  // Get anomalies with AI enrichment
  async getAnomalies(fileId: string, userId: string) {
    const file = await prisma.logFile.findFirst({
      where: { id: fileId, userId },
    })
    if (!file) throw new AppError(404, 'File not found')

    const anomalies = await prisma.anomaly.findMany({
      where: { fileId },
      orderBy: { confidence: 'desc' },
      include: {
        entry: {
          select: {
            timestamp: true,
            sourceIp: true,
            target: true,
            action: true,
            rawLine: true,
          },
        },
      },
    })

    return anomalies
  },
}
