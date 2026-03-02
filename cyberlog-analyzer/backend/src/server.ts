import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { env } from './config/env'
import { errorMiddleware } from './middleware/error.middleware'
import healthRouter from './modules/health/health.routes'
import authRouter from './modules/auth/auth.routes'
import sessionsRouter from './modules/sessions/sessions.routes'
import filesRouter from './modules/files/files.routes'
import { authMiddleware } from './middleware/auth.middleware'
import { uploadMiddleware } from './middleware/upload.middleware'
import { filesController } from './modules/files/files.controller'

const app = express()

// Rate limiter for upload endpoint specifically
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { success: false, error: 'Too many uploads. Try again later.' },
})

const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

// Routes
app.use('/api/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/sessions', sessionsRouter)
app.use('/api/files', filesRouter)

// File upload route lives on sessions (scoped to a session)
// POST /api/sessions/:id/files
app.post(
  '/api/sessions/:id/files',
  authMiddleware,
  uploadLimiter,
  uploadMiddleware.single('file'),
  filesController.upload
)

// Must be last
app.use(errorMiddleware)

app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`)
})

export default app
