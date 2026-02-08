import { Router } from 'express'
import { UsersController } from './users.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { rbacMiddleware } from '../../middleware/rbac.middleware'
import { validate } from '../../middleware/validation.middleware'
import { createUserSchema, updateUserSchema, updateStatusSchema } from './users.validation'

const router = Router()
const controller = new UsersController()

// All routes require authentication
router.use(authMiddleware)

// All user management routes restricted to ADMIN
const adminOnly = rbacMiddleware(['ADMINISTRADOR'])

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

// DELETE /users/:id — ADMIN
router.delete('/:id', adminOnly, controller.delete)

export default router
