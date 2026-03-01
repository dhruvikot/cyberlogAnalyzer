import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { sessionsService } from './sessions.service'
import { AppError } from '../../middleware/error.middleware'

const createSessionSchema = z.object({
  name: z.string().max(100).optional(),
})

export const sessionsController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = createSessionSchema.safeParse(req.body)
      if (!result.success) {
        throw new AppError(400, result.error.errors[0].message)
      }
      const session = await sessionsService.createSession(
        req.user!.userId,
        result.data.name
      )
      res.status(201).json({ success: true, session })
    } catch (error) {
      next(error)
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await sessionsService.getSession(
        req.params.id,
        req.user!.userId
      )
      res.json({ success: true, session })
    } catch (error) {
      next(error)
    }
  },

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessions = await sessionsService.getUserSessions(req.user!.userId)
      res.json({ success: true, sessions })
    } catch (error) {
      next(error)
    }
  },

  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await sessionsService.getSessionSummary(
        req.params.id,
        req.user!.userId
      )
      res.json({ success: true, summary })
    } catch (error) {
      next(error)
    }
  },

  async getCorrelations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const correlations = await sessionsService.getCorrelations(
        req.params.id,
        req.user!.userId
      )
      res.json({ success: true, correlations })
    } catch (error) {
      next(error)
    }
  },

  async deleteSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await sessionsService.deleteSession(req.params.id, req.user!.userId)
      res.json({ success: true, message: 'Session deleted successfully' })
    } catch (error) {
      next(error)
    }
  },
}
