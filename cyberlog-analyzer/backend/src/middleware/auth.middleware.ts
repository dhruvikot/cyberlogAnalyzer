import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { AppError } from './error.middleware'
import { JwtPayload } from '../types'

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Read JWT from httpOnly cookie (not Authorization header)
    // httpOnly cookies are invisible to JavaScript = XSS resistant
    const token = req.cookies?.token

    if (!token) {
      throw new AppError(401, 'Authentication required')
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    req.user = decoded
    next()
  } catch (error) {
    if (error instanceof AppError) {
      next(error)
      return
    }
    // JWT verify threw (expired, invalid signature, etc.)
    next(new AppError(401, 'Invalid or expired token'))
  }
}
