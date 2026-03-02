import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { authService } from './auth.service'
import { AppError } from '../../middleware/error.middleware'

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

const signupSchema = z
  .object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    name: z.string().min(1).max(100).optional(),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = loginSchema.safeParse(req.body)
      if (!result.success) {
        throw new AppError(400, result.error.errors[0].message)
      }

      const { email, password } = result.data
      const { token, user } = await authService.login(email, password)

      res.json({
        success: true,
        token,
        user: { email: user.email, name: user.name },
      })
    } catch (error) {
      next(error)
    }
  },

  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = signupSchema.safeParse(req.body)
      if (!result.success) {
        throw new AppError(400, result.error.errors[0].message)
      }

      const { email, password, name } = result.data
      const { user, token } = await authService.signup(email, password, name)

      res.status(201).json({
        success: true,
        token,
        user: { email: user.email },
      })
    } catch (error) {
      next(error)
    }
  },

  async logout(req: Request, res: Response): Promise<void> {
    res.json({ success: true, message: 'Logged out' })
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getUserById(req.user!.userId)
      res.json({ success: true, user })
    } catch (error) {
      next(error)
    }
  },
}
