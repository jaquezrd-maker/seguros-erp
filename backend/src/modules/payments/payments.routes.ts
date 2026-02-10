import { Router } from 'express'
import { PaymentsController } from './payments.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { rbacMiddleware } from '../../middleware/rbac.middleware'
import { validate } from '../../middleware/validation.middleware'
import { createPaymentSchema, updatePaymentSchema, sendEmailSchema } from './payments.validation'

const router = Router()
const controller = new PaymentsController()

// All routes require authentication
router.use(authMiddleware)

// GET /payments — all roles
router.get('/', controller.list)

// GET /payments/overdue — ADMIN, EJECUTIVO, CONTABILIDAD
router.get(
  '/overdue',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO', 'CONTABILIDAD']),
  controller.overdue
)

// GET /payments/upcoming — ADMIN, EJECUTIVO, CONTABILIDAD
router.get(
  '/upcoming',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO', 'CONTABILIDAD']),
  controller.upcoming
)

// GET /payments/receivables — ADMIN, CONTABILIDAD
router.get(
  '/receivables',
  rbacMiddleware(['ADMINISTRADOR', 'CONTABILIDAD']),
  controller.receivables
)

// POST /payments/policy/:policyId/regenerate — ADMIN, EJECUTIVO
router.post(
  '/policy/:policyId/regenerate',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO']),
  controller.regenerateMissingPayments
)

// GET /payments/:id/pdf — Generate payment receipt PDF (must be before /:id)
router.get('/:id/pdf', controller.generatePDF)

// GET /payments/:id/email/preview — Preview payment email (must be before /:id)
router.get(
  '/:id/email/preview',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO', 'CONTABILIDAD']),
  controller.previewEmail
)

// POST /payments/:id/email — Send payment email (must be before /:id)
router.post(
  '/:id/email',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO', 'CONTABILIDAD']),
  validate(sendEmailSchema),
  controller.sendEmail
)

// GET /payments/:id — all roles
router.get('/:id', controller.getById)

// POST /payments — ADMIN, EJECUTIVO, CONTABILIDAD with validation
router.post(
  '/',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO', 'CONTABILIDAD']),
  validate(createPaymentSchema),
  controller.create
)

// PUT /payments/:id — ADMIN, EJECUTIVO, CONTABILIDAD
router.put(
  '/:id',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO', 'CONTABILIDAD']),
  validate(updatePaymentSchema),
  controller.update
)

// DELETE /payments/:id — ADMIN
router.delete(
  '/:id',
  rbacMiddleware(['ADMINISTRADOR']),
  controller.delete
)

export default router
