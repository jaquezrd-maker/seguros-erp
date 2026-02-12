import { Router } from 'express'
import { UsersController } from './users.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { rbacMiddleware } from '../../middleware/rbac.middleware'
import { validate } from '../../middleware/validation.middleware'
import { createUserSchema, updateUserSchema, updateStatusSchema, resetPasswordSchema } from './users.validation'

const router = Router()
const controller = new UsersController()

// All routes require authentication
router.use(authMiddleware)

// All user management routes restricted to ADMIN
const adminOnly = rbacMiddleware(['ADMINISTRADOR'])
const superAdminOnly = rbacMiddleware(['SUPER_ADMIN'])

// GET /users — ADMIN
router.get('/', adminOnly, controller.list)

// GET /users/:id — ADMIN
router.get('/:id', adminOnly, controller.getById)

// POST /users — ADMIN with validation
router.post('/', adminOnly, validate(createUserSchema), controller.create)

// PUT /users/:id — ADMIN with validation
router.put('/:id', adminOnly, validate(updateUserSchema), controller.update)

// PATCH /users/:id/status — ADMIN
router.patch('/:id/status', adminOnly, validate(updateStatusSchema), controller.updateStatus)

// PATCH /users/:id/password — ADMIN - Reset user password
router.patch('/:id/password', adminOnly, validate(resetPasswordSchema), controller.resetPassword)

// DELETE /users/:id — ADMIN
router.delete('/:id', adminOnly, controller.delete)

// POST /users/cleanup/orphaned — ADMIN (utilidad para limpiar usuarios huérfanos de Supabase)
router.post('/cleanup/orphaned', adminOnly, controller.cleanOrphaned)

// Company management routes - SUPER_ADMIN only
// GET /users/:id/companies — Get companies for a user
router.get('/:id/companies', superAdminOnly, controller.getUserCompanies)

// POST /users/:id/companies — Add user to a company
router.post('/:id/companies', superAdminOnly, controller.addUserToCompany)

// PATCH /users/:id/companies/:companyId — Update user's role in a company
router.patch('/:id/companies/:companyId', superAdminOnly, controller.updateUserCompanyRole)

// DELETE /users/:id/companies/:companyId — Remove user from a company
router.delete('/:id/companies/:companyId', superAdminOnly, controller.removeUserFromCompany)

export default router
