import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware'
import { rbacMiddleware } from '../../middleware/rbac.middleware'
import { validate } from '../../middleware/validation.middleware'
import { policiesController } from './policies.controller'
import { createPolicySchema, updatePolicySchema, updateStatusSchema } from './policies.validation'

const router = Router()

// All routes require authentication
router.use(authMiddleware)

// GET / - List policies (paginated, with filters)
router.get(
  '/',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO', 'SOLO_LECTURA']),
  policiesController.list
)

// GET /expiring - Policies expiring within N days (must be before /:id)
router.get(
  '/expiring',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO']),
  policiesController.getExpiring
)

// POST / - Create a new policy
router.post(
  '/',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO']),
  validate(createPolicySchema),
  policiesController.create
)

// PATCH /:id/status - Update policy status (must be before /:id)
router.patch(
  '/:id/status',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO']),
  validate(updateStatusSchema),
  policiesController.updateStatus
)

// DELETE /:id/permanent - Permanently delete policy (must be before /:id)
router.delete(
  '/:id/permanent',
  rbacMiddleware(['ADMINISTRADOR']),
  policiesController.permanentDelete
)

// GET /:id - Get policy by ID with full details
router.get(
  '/:id',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO', 'SOLO_LECTURA']),
  policiesController.getById
)

// PUT /:id - Update a policy
router.put(
  '/:id',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO']),
  validate(updatePolicySchema),
  policiesController.update
)

// DELETE /:id - Delete (cancel) a policy
router.delete(
  '/:id',
  rbacMiddleware(['ADMINISTRADOR']),
  policiesController.delete
)

export default router
