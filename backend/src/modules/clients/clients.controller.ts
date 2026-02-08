import { Request, Response, NextFunction } from 'express'
import { clientsService } from './clients.service'
import { ClientType, ClientStatus } from '@prisma/client'
import { parsePagination } from '../../utils/pagination'

export const clientsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = parsePagination(req.query as { page?: string; limit?: string })
      const { search, type, status } = req.query

      const result = await clientsService.findAll({
        search: search as string | undefined,
        type: type as ClientType | undefined,
        status: status as ClientStatus | undefined,
        page,
        limit,
      })

      res.json({ success: true, ...result })
    } catch (error) {
      next(error)
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string)

      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID inválido' })
      }

      const client = await clientsService.findById(id)

      res.json({ success: true, data: client })
    } catch (error) {
      next(error)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const client = await clientsService.create({
        ...req.body,
        creator: req.user?.id ? { connect: { id: req.user.id } } : undefined,
      })

      res.status(201).json({ success: true, data: client })
    } catch (error) {
      next(error)
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string)

      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID inválido' })
      }

      const client = await clientsService.update(id, req.body)

      res.json({ success: true, data: client })
    } catch (error) {
      next(error)
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string)

      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID inválido' })
      }

      await clientsService.delete(id)

      res.json({ success: true, message: 'Cliente eliminado correctamente' })
    } catch (error) {
      next(error)
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string)
      const { status } = req.body

      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID inválido' })
      }

      const client = await clientsService.updateStatus(id, status as ClientStatus)

      res.json({ success: true, data: client })
    } catch (error) {
      next(error)
    }
  },
}
