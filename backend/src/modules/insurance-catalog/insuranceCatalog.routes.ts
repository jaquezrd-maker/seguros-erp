import { Router } from 'express'
import catalogController from './insuranceCatalog.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { rbacMiddleware } from '../../middleware/rbac.middleware'
import { validate } from '../../middleware/validation.middleware'
import { createPlanSchema, updatePlanSchema } from './insuranceCatalog.validation'

const router = Router()

// Public routes (no auth needed for catalog browsing)
router.get('/categories', catalogController.getCategories)
router.get('/categories/:slug', catalogController.getCategoryBySlug)
router.get('/products', catalogController.getProducts)
router.get('/products/:id', catalogController.getProductById)
router.get('/products/:id/plans', catalogController.getProductPlans)
router.get('/featured', catalogController.getFeaturedProducts)
router.get('/search', catalogController.searchProducts)

// Protected plan management routes (admin only)
router.post(
  '/plans',
  authMiddleware,
  rbacMiddleware(['ADMINISTRADOR']),
  validate(createPlanSchema),
  catalogController.createPlan
)

router.put(
  '/plans/:planId',
  authMiddleware,
  rbacMiddleware(['ADMINISTRADOR']),
  validate(updatePlanSchema),
  catalogController.updatePlan
)

router.delete(
  '/plans/:planId',
  authMiddleware,
  rbacMiddleware(['ADMINISTRADOR']),
  catalogController.deletePlan
)

export default router
