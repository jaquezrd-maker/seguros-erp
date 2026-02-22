import { Router } from 'express'
import catalogController from './insuranceCatalog.controller'
import { authMiddleware } from '../../middleware/auth.middleware'

const router = Router()

// Public routes (no auth needed for catalog browsing)
router.get('/categories', catalogController.getCategories)
router.get('/categories/:slug', catalogController.getCategoryBySlug)
router.get('/products', catalogController.getProducts)
router.get('/products/:id', catalogController.getProductById)
router.get('/products/:id/plans', catalogController.getProductPlans)
router.get('/featured', catalogController.getFeaturedProducts)
router.get('/search', catalogController.searchProducts)

export default router
