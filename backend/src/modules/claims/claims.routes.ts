import { Router } from 'express'
import { ClaimsController } from './claims.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { rbacMiddleware } from '../../middleware/rbac.middleware'
import { validate } from '../../middleware/validation.middleware'
import { createClaimSchema, updateClaimSchema, addNoteSchema, sendEmailSchema } from './claims.validation'

const router = Router()
const controller = new ClaimsController()

// All routes require authentication
router.use(authMiddleware)

// GET / - List claims
router.get(
  '/',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO', 'SOLO_LECTURA']),
  controller.list
)

// GET /:id/pdf - Generate claim PDF (must be before /:id)
router.get(
  '/:id/pdf',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO', 'SOLO_LECTURA']),
  controller.generatePDF
)

// POST /:id/email - Send claim email (must be before /:id)
router.post(
  '/:id/email',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO']),
  validate(sendEmailSchema),
  controller.sendEmail
)

// GET /:id - Get claim by ID
router.get(
  '/:id',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO', 'SOLO_LECTURA']),
  controller.getById
)

// POST / - Create claim
router.post(
  '/',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO']),
  validate(createClaimSchema),
  controller.create
)

// PUT /:id - Update claim
router.put(
  '/:id',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO']),
  validate(updateClaimSchema),
  controller.update
)

// PATCH /:id/status - Update claim status
router.patch(
  '/:id/status',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO']),
  controller.updateStatus
)

// DELETE /:id - Delete (reject) a claim
router.delete(
  '/:id',
  rbacMiddleware(['ADMINISTRADOR']),
  controller.delete
)

// POST /:id/notes - Add note to claim
router.post(
  '/:id/notes',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO']),
  validate(addNoteSchema),
  controller.addNote
)

export default router
