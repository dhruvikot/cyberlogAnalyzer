import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { randomUUID } from 'crypto'
import { Request } from 'express'
import { AppError } from './error.middleware'
import { env } from '../config/env'

const storage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    // Each upload gets its own folder with uuid
    const uploadId = randomUUID()
    const dir = path.join(env.UPLOAD_DIR, uploadId)

    // Create directory if it doesn't exist
    fs.mkdirSync(dir, { recursive: true })

    // Store uploadId on req for later use in controller
    ;(req as any).uploadId = uploadId
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    // Keep original filename, sanitize it
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    cb(null, sanitized)
  },
})

// Validate file is actually text (log files)
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    'text/plain',
    'text/csv',
    'application/octet-stream', // some systems send .log as this
    'application/csv',
    'text/x-log',
  ]

  const allowedExtensions = ['.log', '.txt', '.csv']
  const ext = path.extname(file.originalname).toLowerCase()

  if (allowedExtensions.includes(ext) || allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError(400, `Invalid file type. Allowed: .log, .txt, .csv`) as any)
  }
}

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
})
