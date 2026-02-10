import { Router } from 'express'
import { RenewalsController } from './renewals.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { rbacMiddleware } from '../../middleware/rbac.middleware'
import { validate } from '../../middleware/validation.middleware'
import { processRenewalSchema, sendEmailSchema } from './renewals.validation'

const router = Router()
const controller = new RenewalsController()

// All routes require authentication
router.use(authMiddleware)

// All renewal routes restricted to ADMIN and EJECUTIVO
const adminEjecutivo = rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO'])

// GET /renewals — ADMIN, EJECUTIVO
router.get('/', adminEjecutivo, controller.list)

// GET /renewals/pending — ADMIN, EJECUTIVO
router.get('/pending', adminEjecutivo, controller.pending)

// POST /renewals/generate — ADMIN, EJECUTIVO
router.post('/generate', adminEjecutivo, controller.generate)

// GET /renewals/:id/pdf — Generate renewal PDF (must be before /:id)
router.get('/:id/pdf', adminEjecutivo, controller.generatePDF)

// GET /renewals/:id/email/preview — Preview renewal email (must be before /:id)
router.get('/:id/email/preview', adminEjecutivo, controller.previewEmail)

// POST /renewals/:id/email — Send renewal email (must be before /:id)
router.post(
  '/:id/email',
  adminEjecutivo,
  validate(sendEmailSchema),
  controller.sendEmail
)

// GET /renewals/:id — ADMIN, EJECUTIVO
router.get('/:id', adminEjecutivo, controller.getById)

// POST /renewals/:id/process — ADMIN, EJECUTIVO with validation
router.post(
  '/:id/process',
  adminEjecutivo,
  validate(processRenewalSchema),
  controller.process
)

// POST /renewals/:id/notify — ADMIN, EJECUTIVO
router.post('/:id/notify', adminEjecutivo, controller.notify)

// PUT /renewals/:id — ADMIN, EJECUTIVO
router.put('/:id', adminEjecutivo, controller.update)

// DELETE /renewals/:id — ADMIN, EJECUTIVO
router.delete('/:id', adminEjecutivo, controller.delete)

export default router
