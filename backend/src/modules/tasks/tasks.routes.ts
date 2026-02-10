import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validation.middleware'
import { tasksController } from './tasks.controller'
import { createTaskSchema, updateTaskSchema } from './tasks.validation'

const router = Router()

// All routes require authentication
router.use(authMiddleware)

// GET / - List user's tasks
router.get('/', tasksController.list)

// GET /:id - Get task by ID
router.get('/:id', tasksController.getById)

// POST / - Create task
router.post('/', validate(createTaskSchema), tasksController.create)

// PUT /:id - Update task
router.put('/:id', validate(updateTaskSchema), tasksController.update)

// PATCH /:id/toggle - Toggle task completion
router.patch('/:id/toggle', tasksController.toggleComplete)

// DELETE /:id - Delete task
router.delete('/:id', tasksController.delete)

export default router
