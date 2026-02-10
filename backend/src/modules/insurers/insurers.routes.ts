import { Router } from 'express'
import { InsurersController } from './insurers.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { rbacMiddleware } from '../../middleware/rbac.middleware'
import { validate } from '../../middleware/validation.middleware'
import { createInsurerSchema, updateInsurerSchema } from './insurers.validation'

const router = Router()
const controller = new InsurersController()

router.use(authMiddleware)

router.get(
  '/',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO', 'SOLO_LECTURA']),
  controller.list
)

// GET /search?name=... - Search company by name in DGII database (must be before /:id)
router.get(
  '/search',
  rbacMiddleware(['ADMINISTRADOR']),
  controller.searchName
)

// GET /rnc/:rnc - Lookup RNC in DGII database (must be before /:id)
router.get(
  '/rnc/:rnc',
  rbacMiddleware(['ADMINISTRADOR']),
  controller.lookupRNC
)

router.get(
  '/:id',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO', 'SOLO_LECTURA']),
  controller.getById
)

router.post(
  '/',
  rbacMiddleware(['ADMINISTRADOR']),
  validate(createInsurerSchema),
  controller.create
)

router.put(
  '/:id',
  rbacMiddleware(['ADMINISTRADOR']),
  validate(updateInsurerSchema),
  controller.update
)

router.patch(
  '/:id/status',
  rbacMiddleware(['ADMINISTRADOR']),
  controller.updateStatus
)

router.delete(
  '/:id',
  rbacMiddleware(['ADMINISTRADOR']),
  controller.delete
)

export default router
