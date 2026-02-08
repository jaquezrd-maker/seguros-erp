import { Router } from 'express'
import { AIController } from './ai.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { rbacMiddleware } from '../../middleware/rbac.middleware'

const router = Router()
const controller = new AIController()

// All routes require authentication
router.use(authMiddleware)

// GET /ai/insights — All authenticated users
router.get('/insights', controller.getInsights)

// GET /ai/suggestions — ADMIN, EJECUTIVO
router.get(
  '/suggestions',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO']),
  controller.getOverallSuggestions
)

// GET /ai/clients/:clientId/suggestions — All authenticated users
router.get('/clients/:clientId/suggestions', controller.getClientSuggestions)

// GET /ai/policy-stats — All authenticated users
router.get('/policy-stats', controller.getPolicyStats)

export default router
