import { Router } from 'express'
import { clientPortalController } from './client-portal.controller'
import { validate } from '../../middleware/validation.middleware'
import { authMiddleware } from '../../middleware/auth.middleware'
import { rbacMiddleware } from '../../middleware/rbac.middleware'
import {
  validateInvitationSchema,
  completeRegistrationSchema,
  changePasswordSchema
} from './client-portal.validation'

const router = Router()

// Rutas públicas (sin autenticación)
router.get(
  '/validate/:token',
  validate(validateInvitationSchema),
  clientPortalController.validateInvitation
)

router.post(
  '/register',
  validate(completeRegistrationSchema),
  clientPortalController.completeRegistration
)

// Rutas protegidas (requieren autenticación)
router.post(
  '/change-password',
  authMiddleware,
  validate(changePasswordSchema),
  clientPortalController.changePassword
)

// Ruta para crear invitación (solo usuarios internos)
router.post(
  '/invitations/:clientId',
  authMiddleware,
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO']),
  clientPortalController.createInvitation
)

export default router
