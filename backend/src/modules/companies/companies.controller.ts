import { Request, Response } from 'express'
import companiesService from './companies.service'

/**
 * Companies Controller
 * Handles HTTP requests for company management
 * All endpoints require SUPER_ADMIN role (enforced in routes)
 */
class CompaniesController {
  /**
   * Get all companies with pagination and search
   * GET /api/companies?page=1&limit=10&search=texto&status=ACTIVO
   */
  async list(req: Request, res: Response) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : undefined
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined
      const search = typeof req.query.search === 'string' ? req.query.search : undefined
      const status = typeof req.query.status === 'string' ? req.query.status : undefined

      // If no pagination params provided, return all companies without pagination
      if (!page && !limit) {
        const { companies } = await companiesService.findAll(1, 1000, search, status)
        return res.json({
          success: true,
          data: companies,
        })
      }

      // Otherwise, return paginated response
      const { companies, total } = await companiesService.findAll(
        page || 1,
        limit || 10,
        search,
        status
      )

      res.json({
        success: true,
        data: companies,
        pagination: {
          total,
          page: page || 1,
          limit: limit || 10,
          totalPages: Math.ceil(total / (limit || 10)),
        },
      })
    } catch (error: any) {
      console.error('[COMPANIES] Error listing companies:', error)
      res.status(500).json({
        success: false,
        message: error.message || 'Error al listar empresas',
      })
    }
  }

  /**
   * Get a single company by ID
   * GET /api/companies/:id
   */
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(String(req.params.id))

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de empresa inválido',
        })
      }

      const company = await companiesService.findById(id)

      res.json({
        success: true,
        data: company,
      })
    } catch (error: any) {
      console.error('[COMPANIES] Error fetching company:', error)
      res.status(error.message === 'Empresa no encontrada' ? 404 : 500).json({
        success: false,
        message: error.message || 'Error al obtener empresa',
      })
    }
  }

  /**
   * Create a new company
   * POST /api/companies
   */
  async create(req: Request, res: Response) {
    try {
      const company = await companiesService.create(req.body)

      res.status(201).json({
        success: true,
        data: company,
        message: 'Empresa creada exitosamente',
      })
    } catch (error: any) {
      console.error('[COMPANIES] Error creating company:', error)
      res.status(error.message.includes('ya está') ? 409 : 500).json({
        success: false,
        message: error.message || 'Error al crear empresa',
      })
    }
  }

  /**
   * Update a company
   * PUT /api/companies/:id
   */
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(String(req.params.id))

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de empresa inválido',
        })
      }

      const company = await companiesService.update(id, req.body)

      res.json({
        success: true,
        data: company,
        message: 'Empresa actualizada exitosamente',
      })
    } catch (error: any) {
      console.error('[COMPANIES] Error updating company:', error)
      const statusCode = error.message === 'Empresa no encontrada' ? 404 : error.message.includes('ya está') ? 409 : 500
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error al actualizar empresa',
      })
    }
  }

  /**
   * Delete a company (soft delete)
   * DELETE /api/companies/:id
   */
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(String(req.params.id))

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de empresa inválido',
        })
      }

      await companiesService.delete(id)

      res.json({
        success: true,
        message: 'Empresa eliminada exitosamente',
      })
    } catch (error: any) {
      console.error('[COMPANIES] Error deleting company:', error)
      res.status(error.message === 'Empresa no encontrada' ? 404 : 500).json({
        success: false,
        message: error.message || 'Error al eliminar empresa',
      })
    }
  }

  /**
   * Add a user to a company
   * POST /api/companies/:id/users
   */
  async addUser(req: Request, res: Response) {
    try {
      const companyId = parseInt(String(req.params.id))

      if (isNaN(companyId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de empresa inválido',
        })
      }

      const companyUser = await companiesService.addUser(companyId, req.body)

      res.status(201).json({
        success: true,
        data: companyUser,
        message: 'Usuario agregado a la empresa exitosamente',
      })
    } catch (error: any) {
      console.error('[COMPANIES] Error adding user to company:', error)
      const statusCode =
        error.message.includes('no encontrad') ? 404 : error.message.includes('ya pertenece') ? 409 : 500
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error al agregar usuario a la empresa',
      })
    }
  }

  /**
   * Update a user's role in a company
   * PATCH /api/companies/:id/users/:userId
   */
  async updateUser(req: Request, res: Response) {
    try {
      const companyId = parseInt(String(req.params.id))
      const userId = parseInt(String(req.params.userId))

      if (isNaN(companyId) || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
        })
      }

      const companyUser = await companiesService.updateUser(companyId, userId, req.body)

      res.json({
        success: true,
        data: companyUser,
        message: 'Usuario actualizado exitosamente',
      })
    } catch (error: any) {
      console.error('[COMPANIES] Error updating company user:', error)
      res.status(error.message.includes('no encontrad') ? 404 : 500).json({
        success: false,
        message: error.message || 'Error al actualizar usuario',
      })
    }
  }

  /**
   * Remove a user from a company
   * DELETE /api/companies/:id/users/:userId
   */
  async removeUser(req: Request, res: Response) {
    try {
      const companyId = parseInt(String(req.params.id))
      const userId = parseInt(String(req.params.userId))

      if (isNaN(companyId) || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
        })
      }

      await companiesService.removeUser(companyId, userId)

      res.json({
        success: true,
        message: 'Usuario removido de la empresa exitosamente',
      })
    } catch (error: any) {
      console.error('[COMPANIES] Error removing user from company:', error)
      res.status(error.message.includes('no encontrad') ? 404 : 500).json({
        success: false,
        message: error.message || 'Error al remover usuario de la empresa',
      })
    }
  }
}

export default new CompaniesController()
