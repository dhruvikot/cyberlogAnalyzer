import { Router } from 'express'
import { filesController } from './files.controller'
import { authMiddleware } from '../../middleware/auth.middleware'

const router = Router()

router.use(authMiddleware)

// GET /api/files/:fileId
router.get('/:fileId', filesController.getFile)

// GET /api/files/:fileId/analysis
router.get('/:fileId/analysis', filesController.getAnalysis)

// GET /api/files/:fileId/entries
router.get('/:fileId/entries', filesController.getEntries)

// GET /api/files/:fileId/anomalies
router.get('/:fileId/anomalies', filesController.getAnomalies)

// DELETE /api/files/:fileId
router.delete('/:fileId', filesController.deleteFile)

export default router
