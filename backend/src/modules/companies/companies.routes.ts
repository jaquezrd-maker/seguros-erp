import { Router } from 'express'
import companiesController from './companies.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { rbacMiddleware } from '../../middleware/rbac.middleware'
import { validate } from '../../middleware/validation.middleware'
import {
  createCompanySchema,
  updateCompanySchema,
  addUserToCompanySchema,
  updateCompanyUserSchema,
} from './companies.validation'

const router = Router()

// All routes require authentication
router.use(authMiddleware)

// All company management routes restricted to SUPER_ADMIN
const superAdminOnly = rbacMiddleware(['SUPER_ADMIN'])

// GET /companies - List all companies with pagination and search
router.get('/', superAdminOnly, companiesController.list)

// GET /companies/:id - Get company by ID with details
router.get('/:id', superAdminOnly, companiesController.getById)

// POST /companies - Create new company
router.post('/', superAdminOnly, validate(createCompanySchema), companiesController.create)

// PUT /companies/:id - Update company
router.put('/:id', superAdminOnly, validate(updateCompanySchema), companiesController.update)

// DELETE /companies/:id - Delete company (soft delete)
router.delete('/:id', superAdminOnly, companiesController.delete)

// POST /companies/:id/users - Add user to company
router.post('/:id/users', superAdminOnly, validate(addUserToCompanySchema), companiesController.addUser)

// PATCH /companies/:id/users/:userId - Update user's role in company
router.patch(
  '/:id/users/:userId',
  superAdminOnly,
  validate(updateCompanyUserSchema),
  companiesController.updateUser
)

// DELETE /companies/:id/users/:userId - Remove user from company
router.delete('/:id/users/:userId', superAdminOnly, companiesController.removeUser)

export default router
