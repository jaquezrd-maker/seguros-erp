import { Router } from 'express'
import { CommissionsController } from './commissions.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { rbacMiddleware } from '../../middleware/rbac.middleware'
import { validate } from '../../middleware/validation.middleware'
import { createCommissionSchema } from './commissions.validation'

const router = Router()
const controller = new CommissionsController()

// All routes require authentication
router.use(authMiddleware)

// All commission routes restricted to ADMIN and CONTABILIDAD
const adminContabilidad = rbacMiddleware(['ADMINISTRADOR', 'CONTABILIDAD'])

// GET /commissions — ADMIN, CONTABILIDAD
router.get('/', adminContabilidad, controller.list)

// GET /commissions/summary — ADMIN, CONTABILIDAD
router.get('/summary', adminContabilidad, controller.summary)

// GET /commissions/:id — ADMIN, CONTABILIDAD
router.get('/:id', adminContabilidad, controller.getById)

// POST /commissions — ADMIN, CONTABILIDAD with validation
router.post(
  '/',
  adminContabilidad,
  validate(createCommissionSchema),
  controller.create
)

// PATCH /commissions/:id/pay — ADMIN, CONTABILIDAD
router.patch('/:id/pay', adminContabilidad, controller.markAsPaid)

// DELETE /commissions/:id — ADMIN only
router.delete('/:id', rbacMiddleware(['ADMINISTRADOR']), controller.delete)

export default router
