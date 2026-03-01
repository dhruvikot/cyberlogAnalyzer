import { prisma } from '../../config/database'
import { AppError } from '../../middleware/error.middleware'

export const sessionsService = {
  // Create a new upload session (groups multiple files together)
  async createSession(userId: string, name?: string) {
    const session = await prisma.uploadSession.create({
      data: {
        userId,
        name: name ?? `Session ${new Date().toLocaleString()}`,
      },
      include: {
        logFiles: true,
      },
    })
    return session
  },

  // Get session with all its files
  async getSession(sessionId: string, userId: string) {
    const session = await prisma.uploadSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        logFiles: {
          select: {
            id: true,
            originalName: true,
            logType: true,
            status: true,
            totalLines: true,
            parsedLines: true,
            errorMessage: true,
            createdAt: true,
            completedAt: true,
          },
        },
      },
    })

    if (!session) {
      throw new AppError(404, 'Session not found')
    }

    return session
  },

  // Get all sessions for a user
  async getUserSessions(userId: string) {
    return prisma.uploadSession.findMany({
      where: { userId },
      include: {
        logFiles: {
          select: {
            id: true,
            originalName: true,
            logType: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  // Session-level summary: total events + anomalies across all files
  async getSessionSummary(sessionId: string, userId: string) {
    // Verify session belongs to user
    const session = await prisma.uploadSession.findFirst({
      where: { id: sessionId, userId },
    })
    if (!session) throw new AppError(404, 'Session not found')

    const files = await prisma.logFile.findMany({
      where: { sessionId },
      include: {
        _count: {
          select: { entries: true, anomalies: true },
        },
      },
    })

    const totalEvents = files.reduce((sum, f) => sum + f._count.entries, 0)
    const totalAnomalies = files.reduce((sum, f) => sum + f._count.anomalies, 0)
    const completedFiles = files.filter(f => f.status === 'complete').length

    return {
      sessionId,
      name: session.name,
      totalFiles: files.length,
      completedFiles,
      totalEvents,
      totalAnomalies,
      files: files.map(f => ({
        id: f.id,
        name: f.originalName,
        logType: f.logType,
        status: f.status,
        events: f._count.entries,
        anomalies: f._count.anomalies,
      })),
    }
  },

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    const session = await prisma.uploadSession.findFirst({
      where: { id: sessionId, userId },
      include: { logFiles: true },
    })
    if (!session) throw new AppError(404, 'Session not found')

    for (const file of session.logFiles) {
      try {
        const fs = await import('fs/promises')
        const path = await import('path')
        const dir = path.dirname(file.filePath)
        await fs.rm(dir, { recursive: true, force: true })
      } catch (e) {
        console.warn('Could not delete file from disk:', e)
      }
    }

    // Delete log files first — each cascades to its entries + anomalies.
    // UploadSession has no cascade delete in schema so this must be explicit.
    await prisma.logFile.deleteMany({ where: { sessionId } })

    await prisma.uploadSession.delete({ where: { id: sessionId } })
  },

  // Cross-file correlation: same IP anomalous in multiple files
  async getCorrelations(sessionId: string, userId: string) {
    const session = await prisma.uploadSession.findFirst({
      where: { id: sessionId, userId },
    })
    if (!session) throw new AppError(404, 'Session not found')

    // Find IPs that appear as anomalous across multiple files or rules
    const correlations = await prisma.$queryRaw<any[]>`
      SELECT 
        le."sourceIp",
        array_agg(DISTINCT lf."logType") as "seenIn",
        array_agg(DISTINCT a."ruleName") as "rulesTriggered",
        MAX(a.confidence) as "maxConfidence",
        COUNT(a.id)::int as "totalAnomalies"
      FROM "Anomaly" a
      JOIN "LogFile" lf ON a."fileId" = lf.id
      LEFT JOIN "LogEntry" le ON a."entryId" = le.id
      WHERE lf."sessionId" = ${sessionId}
        AND le."sourceIp" IS NOT NULL
      GROUP BY le."sourceIp"
      HAVING 
        COUNT(DISTINCT lf.id) > 1 
        OR COUNT(DISTINCT a."ruleName") > 1
      ORDER BY MAX(a.confidence) DESC
      LIMIT 20
    `

    return correlations.map(c => ({
      sourceIp: c.sourceIp,
      seenIn: c.seenIn.filter(Boolean),
      rulesTriggered: c.rulesTriggered.filter(Boolean),
      maxConfidence: parseFloat(c.maxConfidence),
      totalAnomalies: c.totalAnomalies,
      narrative: `IP ${c.sourceIp} triggered ${c.rulesTriggered.length} anomaly rule(s) across ${c.seenIn.length} log source(s), suggesting coordinated or multi-vector activity.`,
    }))
  },
}
