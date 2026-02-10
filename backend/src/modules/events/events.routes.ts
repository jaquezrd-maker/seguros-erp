import { Router } from 'express'
import { EventsController } from './events.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { rbacMiddleware } from '../../middleware/rbac.middleware'
import { validate } from '../../middleware/validation.middleware'
import { createEventSchema, updateEventSchema } from './events.validation'

const router = Router()
const controller = new EventsController()

// All routes require authentication
router.use(authMiddleware)

// GET /events/calendar - Get calendar events with policy expirations and payments
router.get('/calendar', controller.getCalendar)

// GET /events - List events
router.get('/', controller.list)

// GET /events/:id - Get event by ID
router.get('/:id', controller.getById)

// POST /events - Create event
router.post(
  '/',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO', 'CONTABILIDAD']),
  validate(createEventSchema),
  controller.create
)

// PUT /events/:id - Update event
router.put(
  '/:id',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO', 'CONTABILIDAD']),
  validate(updateEventSchema),
  controller.update
)

// DELETE /events/:id - Delete event
router.delete(
  '/:id',
  rbacMiddleware(['ADMINISTRADOR', 'EJECUTIVO', 'CONTABILIDAD']),
  controller.delete
)

export default router
