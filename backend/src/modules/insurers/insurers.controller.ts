import { Request, Response, NextFunction } from 'express'
import { InsurersService } from './insurers.service'
import { lookupRNC, searchByName } from '../../utils/rncLookup'

const service = new InsurersService()

export class InsurersController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const search = req.query.search as string | undefined
      const status = req.query.status as string | undefined

      const result = await service.findAll({ search, status, page, limit })

      res.json({ success: true, ...result })
    } catch (error) {
      next(error)
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string)
      const insurer = await service.findById(id)

      res.json({ success: true, data: insurer })
    } catch (error) {
      next(error)
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const insurer = await service.create(req.body)

      res.status(201).json({ success: true, data: insurer })
    } catch (error) {
      next(error)
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string)
      const insurer = await service.update(id, req.body)

      res.json({ success: true, data: insurer })
    } catch (error) {
      next(error)
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string)
      const { status } = req.body
      const insurer = await service.updateStatus(id, status)

      res.json({ success: true, data: insurer })
    } catch (error) {
      next(error)
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string)
      const insurer = await service.delete(id)

      res.json({ success: true, message: `Aseguradora ${insurer.name} deshabilitada exitosamente`, data: insurer })
    } catch (error) {
      next(error)
    }
  }

  async lookupRNC(req: Request, res: Response, next: NextFunction) {
    try {
      const { rnc } = req.params

      if (!rnc) {
        return res.status(400).json({ success: false, message: 'RNC es requerido' })
      }

      const rncData = await lookupRNC(String(rnc))

      if (!rncData) {
        return res.status(404).json({ success: false, message: 'RNC no encontrado en la base de datos DGII' })
      }

      res.json({ success: true, data: rncData })
    } catch (error) {
      next(error)
    }
  }

  async searchName(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.query

      if (!name || typeof name !== 'string') {
        return res.status(400).json({ success: false, message: 'Nombre es requerido' })
      }

      if (name.length < 3) {
        return res.status(400).json({ success: false, message: 'El nombre debe tener al menos 3 caracteres' })
      }

      const results = await searchByName(name, 10)

      res.json({ success: true, data: results, total: results.length })
    } catch (error) {
      next(error)
    }
  }
}
