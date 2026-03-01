import { Router } from 'express'
import { sessionsController } from './sessions.controller'
import { authMiddleware } from '../../middleware/auth.middleware'

const router = Router()

// All session routes require auth
router.use(authMiddleware)

router.post('/', sessionsController.create)
router.get('/', sessionsController.getAll)
router.get('/:id', sessionsController.getOne)
router.get('/:id/summary', sessionsController.getSummary)
router.get('/:id/correlations', sessionsController.getCorrelations)
router.delete('/:id', sessionsController.deleteSession)

export default router
