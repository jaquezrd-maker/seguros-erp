import { Router } from 'express'
import { AuthController } from './auth.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import rateLimit from 'express-rate-limit'

const router = Router()
const controller = new AuthController()

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 })

router.post('/login', loginLimiter, controller.login)
router.post('/register', controller.register)
router.get('/me', authMiddleware, controller.me)
router.post('/logout', authMiddleware, controller.logout)
router.post('/switch-company', authMiddleware, controller.switchCompany)

export default router
