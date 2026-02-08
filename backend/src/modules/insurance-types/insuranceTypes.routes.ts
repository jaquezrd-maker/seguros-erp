import { Router } from 'express'
import prisma from '../../config/database'
import { authMiddleware } from '../../middleware/auth.middleware'

const router = Router()

router.use(authMiddleware)

router.get('/', async (_req, res, next) => {
  try {
    const types = await prisma.insuranceType.findMany({
      orderBy: { name: 'asc' },
    })
    res.json({ success: true, data: types })
  } catch (error) {
    next(error)
  }
})

export default router
