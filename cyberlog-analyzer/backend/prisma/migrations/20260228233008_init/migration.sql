-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('nginx', 'zscaler', 'unknown');

-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('uploaded', 'processing', 'complete', 'failed');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogFile" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "logType" "LogType" NOT NULL,
    "status" "FileStatus" NOT NULL,
    "totalLines" INTEGER,
    "parsedLines" INTEGER,
    "errorMessage" TEXT,
    "aiSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "LogFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogEntry" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "sourceIp" TEXT,
    "userIdentity" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "statusCode" INTEGER,
    "bytesSent" BIGINT,
    "bytesReceived" BIGINT,
    "severity" "Severity" NOT NULL DEFAULT 'low',
    "rawLine" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "LogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anomaly" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "entryId" TEXT,
    "ruleName" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "context" JSONB NOT NULL,
    "aiExplanation" TEXT,
    "aiThreatCategory" TEXT,
    "aiMitreTechnique" TEXT,
    "aiAction" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Anomaly_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "LogEntry_fileId_timestamp_idx" ON "LogEntry"("fileId", "timestamp");

-- CreateIndex
CREATE INDEX "LogEntry_fileId_sourceIp_idx" ON "LogEntry"("fileId", "sourceIp");

-- CreateIndex
CREATE INDEX "Anomaly_fileId_confidence_idx" ON "Anomaly"("fileId", "confidence" DESC);

-- AddForeignKey
ALTER TABLE "UploadSession" ADD CONSTRAINT "UploadSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogFile" ADD CONSTRAINT "LogFile_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "UploadSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogFile" ADD CONSTRAINT "LogFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "LogFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anomaly" ADD CONSTRAINT "Anomaly_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "LogFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anomaly" ADD CONSTRAINT "Anomaly_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "LogEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
