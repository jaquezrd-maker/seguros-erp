import { Request, Response } from 'express'
import catalogService from './insuranceCatalog.service'

class InsuranceCatalogController {
  async getCategories(_req: Request, res: Response) {
    try {
      const categories = await catalogService.getCategories()
      return res.json({ success: true, data: categories })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  async getCategoryBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params
      const category = await catalogService.getCategoryBySlug(slug)
      if (!category) {
        return res.status(404).json({ success: false, message: 'Categoría no encontrada' })
      }
      return res.json({ success: true, data: category })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  async getProducts(req: Request, res: Response) {
    try {
      const { categoryId, insurerId, page = '1', limit = '20' } = req.query
      const products = await catalogService.getProducts({
        categoryId: categoryId ? parseInt(categoryId as string) : undefined,
        insurerId: insurerId ? parseInt(insurerId as string) : undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      })
      return res.json({ success: true, ...products })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  async getProductById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id)
      const product = await catalogService.getProductById(id)
      if (!product) {
        return res.status(404).json({ success: false, message: 'Producto no encontrado' })
      }
      return res.json({ success: true, data: product })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  async getProductPlans(req: Request, res: Response) {
    try {
      const productId = parseInt(req.params.id)
      const plans = await catalogService.getProductPlans(productId)
      return res.json({ success: true, data: plans })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  async getFeaturedProducts(_req: Request, res: Response) {
    try {
      const products = await catalogService.getFeaturedProducts()
      return res.json({ success: true, data: products })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  async searchProducts(req: Request, res: Response) {
    try {
      const { q } = req.query
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ success: false, message: 'Parámetro de búsqueda requerido' })
      }
      const products = await catalogService.searchProducts(q)
      return res.json({ success: true, data: products })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  }
}

export default new InsuranceCatalogController()
