import { Router } from 'express'
import { authController } from './auth.controller'
import { authMiddleware } from '../../middleware/auth.middleware'

const router = Router()

// Public routes
router.post('/login', authController.login)
router.post('/signup', authController.signup)
router.post('/logout', authController.logout)

// Protected route - requires valid JWT cookie
router.get('/me', authMiddleware, authController.me)

export default router
