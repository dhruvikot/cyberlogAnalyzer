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

const getAllowedOrigins = (): string[] => {
  const origins = [
    'http://localhost:3000',
    'https://cyberlog-analyzer.vercel.app',
  ]

  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL)
  }

  return [...new Set(origins)] // deduplicate
}

app.use(cors({
  origin: (origin, callback) => {
    const allowed = getAllowedOrigins()

    console.log('[CORS] Request from origin:', origin)
    console.log('[CORS] Allowed origins:', allowed)

    if (!origin) {
      return callback(null, true)
    }

    if (allowed.includes(origin)) {
      return callback(null, true)
    }

    console.log('[CORS] Blocked origin:', origin)
    return callback(
      new Error(`CORS: Origin ${origin} is not permitted`),
      false
    )
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.options('*', cors({
  origin: (origin, callback) => {
    const allowed = getAllowedOrigins()
    if (!origin || allowed.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error('Not allowed'), false)
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
