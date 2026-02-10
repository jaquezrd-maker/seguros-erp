import { Router } from 'express'
import { portalDataController } from './portal-data.controller'
import { validate } from '../../middleware/validation.middleware'
import { authMiddleware } from '../../middleware/auth.middleware'
import { clientDataIsolation } from '../../middleware/client-isolation.middleware'
import {
  getPoliciesSchema,
  getPolicyDetailSchema,
  createClaimSchema
} from './portal-data.validation'

const router = Router()

// TODAS las rutas requieren autenticación + aislamiento de datos de cliente
router.use(authMiddleware)
router.use(clientDataIsolation())

// Dashboard
router.get('/dashboard', portalDataController.getDashboard)

// Pólizas
router.get(
  '/policies',
  validate(getPoliciesSchema),
  portalDataController.getPolicies
)

router.get(
  '/policies/:id',
  validate(getPolicyDetailSchema),
  portalDataController.getPolicyDetail
)

// Pagos
router.get('/payments', portalDataController.getPayments)

// Renovaciones
router.get('/renewals', portalDataController.getRenewals)

// Reclamos
router.get('/claims', portalDataController.getClaims)

router.post(
  '/claims',
  validate(createClaimSchema),
  portalDataController.createClaim
)

// Perfil
router.get('/profile', portalDataController.getProfile)

export default router
