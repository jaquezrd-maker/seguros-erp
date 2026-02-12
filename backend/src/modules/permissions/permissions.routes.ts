import { Router } from 'express'
import permissionsController from './permissions.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { rbacMiddleware } from '../../middleware/rbac.middleware'
import { validate } from '../../middleware/validation.middleware'
import { updatePermissionsSchema, roleParamSchema } from './permissions.validation'

const router = Router()

// All routes require authentication
router.use(authMiddleware)

// GET /permissions/me - Get current user's permissions
router.get('/me', permissionsController.getMyPermissions)

// GET /permissions - Get all permissions (SUPER_ADMIN only)
router.get('/', rbacMiddleware(['SUPER_ADMIN']), permissionsController.getAllPermissions)

// GET /permissions/:role - Get permissions for specific role (SUPER_ADMIN only)
router.get(
  '/:role',
  rbacMiddleware(['SUPER_ADMIN']),
  validate(roleParamSchema),
  permissionsController.getPermissionsByRole
)

// PUT /permissions/:role - Update permissions for role (SUPER_ADMIN only)
router.put(
  '/:role',
  rbacMiddleware(['SUPER_ADMIN']),
  validate(roleParamSchema),
  validate(updatePermissionsSchema),
  permissionsController.updateRolePermissions
)

export default router
