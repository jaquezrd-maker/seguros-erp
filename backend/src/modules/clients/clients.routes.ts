import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware'
import { rbacMiddleware } from '../../middleware/rbac.middleware'
import { validate } from '../../middleware/validation.middleware'
import { clientsController } from './clients.controller'
import { createClientSchema, updateClientSchema } from './clients.validation'

const router = Router()

// All routes require authentication
router.use(authMiddleware)

// GET / - List clients
router.get(
  '/',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO', 'SOLO_LECTURA']),
  clientsController.list,
)

// GET /:id - Get client by ID
router.get(
  '/:id',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO', 'SOLO_LECTURA']),
  clientsController.getById,
)

// POST / - Create client
router.post(
  '/',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO']),
  validate(createClientSchema),
  clientsController.create,
)

// PUT /:id - Update client
router.put(
  '/:id',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO']),
  validate(updateClientSchema),
  clientsController.update,
)

// PATCH /:id/status - Update client status
router.patch(
  '/:id/status',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO']),
  clientsController.updateStatus,
)

// DELETE /:id - Soft delete client
router.delete(
  '/:id',
  rbacMiddleware(['ADMINISTRADOR']),
  clientsController.delete,
)

export default router
