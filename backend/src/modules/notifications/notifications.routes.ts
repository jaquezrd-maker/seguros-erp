import { Router } from 'express'
import { notificationsController } from './notifications.controller'
import { authMiddleware } from '../../middleware/auth.middleware'

const router = Router()

// All routes require authentication
router.use(authMiddleware)

// Trigger payment reminders manually
router.post('/reminders/trigger', notificationsController.triggerPaymentReminders)

// Get notification statistics
router.get('/statistics', notificationsController.getStatistics)

// Get upcoming payment reminders
router.get('/reminders/upcoming', notificationsController.getUpcomingReminders)

export default router
