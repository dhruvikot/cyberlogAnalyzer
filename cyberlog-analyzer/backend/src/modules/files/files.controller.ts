import { Request, Response, NextFunction } from 'express'
import { filesService } from './files.service'
import { AppError } from '../../middleware/error.middleware'
import { processingService } from '../parsers/processing.service'

export const filesController = {
  // POST /api/sessions/:id/files
  // Multer already saved file to disk before this runs
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new AppError(400, 'No file uploaded')
      }

      // Create DB record for the uploaded file
      const fileRecord = await filesService.createFileRecord({
        sessionId: req.params.id,
        userId: req.user!.userId,
        originalName: req.file.originalname,
        filePath: req.file.path,
      })

      // Trigger processing asynchronously — respond to client first,
      // then processing starts on next event loop tick
      setImmediate(() => {
        processingService.processFile(fileRecord.id).catch(err => {
          console.error('Processing error:', err)
        })
      })

      res.status(201).json({
        success: true,
        message: 'File uploaded. Processing will begin shortly.',
        file: {
          id: fileRecord.id,
          name: fileRecord.originalName,
          status: fileRecord.status,
          logType: fileRecord.logType,
        },
      })
    } catch (error) {
      next(error)
    }
  },

  async getFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = await filesService.getFile(req.params.fileId, req.user!.userId)
      res.json({ success: true, file })
    } catch (error) {
      next(error)
    }
  },

  async getAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analysis = await filesService.getAnalysis(
        req.params.fileId,
        req.user!.userId
      )
      res.json({ success: true, analysis })
    } catch (error) {
      next(error)
    }
  },

  async getEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)

      const data = await filesService.getEntries(
        req.params.fileId,
        req.user!.userId,
        {
          page,
          limit,
          ip: req.query.ip as string,
          severity: req.query.severity as string,
          from: req.query.from as string,
          to: req.query.to as string,
        }
      )
      res.json({ success: true, ...data })
    } catch (error) {
      next(error)
    }
  },

  async getAnomalies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const anomalies = await filesService.getAnomalies(
        req.params.fileId,
        req.user!.userId
      )
      res.json({ success: true, anomalies })
    } catch (error) {
      next(error)
    }
  },

  async deleteFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await filesService.deleteFile(req.params.fileId, req.user!.userId)
      res.json({ success: true, message: 'Report deleted successfully' })
    } catch (error) {
      next(error)
    }
  },
}
