import { Request, Response, NextFunction } from 'express'
import { policiesService } from './policies.service'
import { PolicyStatus } from '@prisma/client'

export const policiesController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        search,
        status,
        insurerId,
        clientId,
        page = '1',
        limit = '20',
      } = req.query

      const result = await policiesService.findAll({
        search: search as string | undefined,
        status: status as PolicyStatus | undefined,
        insurerId: insurerId ? Number(insurerId) : undefined,
        clientId: clientId ? Number(clientId) : undefined,
        page: Math.max(1, Number(page)),
        limit: Math.min(100, Math.max(1, Number(limit))),
      })

      res.json({ success: true, ...result })
    } catch (error) {
      next(error)
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      const policy = await policiesService.findById(id)
      res.json({ success: true, data: policy })
    } catch (error) {
      next(error)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = {
        ...req.body,
        createdBy: req.user?.id,
      }
      const policy = await policiesService.create(data)
      res.status(201).json({ success: true, data: policy })
    } catch (error) {
      next(error)
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      const policy = await policiesService.update(id, req.body)
      res.json({ success: true, data: policy })
    } catch (error) {
      next(error)
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      const { status } = req.body
      const policy = await policiesService.updateStatus(id, status as PolicyStatus)
      res.json({ success: true, data: policy })
    } catch (error) {
      next(error)
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      console.log(`[SOFT DELETE] Canceling policy ID: ${id}`)
      const policy = await policiesService.delete(id)
      res.json({ success: true, message: `Póliza ${policy.policyNumber} cancelada exitosamente`, data: policy })
    } catch (error) {
      next(error)
    }
  },

  async permanentDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      console.log(`[PERMANENT DELETE] Attempting to permanently delete policy ID: ${id}`)
      const result = await policiesService.permanentDelete(id)

      const deletedCount = Object.values(result.deleted).reduce((sum, count) => sum + count, 0)
      console.log(`[PERMANENT DELETE] Successfully deleted policy ${result.policyNumber} and ${deletedCount} related records`)
      res.json({
        success: true,
        message: `Póliza ${result.policyNumber} y ${deletedCount} registros relacionados eliminados permanentemente`,
        data: result
      })
    } catch (error) {
      console.log(`[PERMANENT DELETE] Error:`, error)
      next(error)
    }
  },

  async getExpiring(req: Request, res: Response, next: NextFunction) {
    try {
      const days = req.query.days ? Number(req.query.days) : 30
      const policies = await policiesService.getExpiring(days)
      res.json({ success: true, data: policies, total: policies.length })
    } catch (error) {
      next(error)
    }
  },
}
