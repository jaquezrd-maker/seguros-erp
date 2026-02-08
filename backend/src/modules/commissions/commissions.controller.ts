import { Request, Response } from 'express'
import { CommissionsService } from './commissions.service'

const commissionsService = new CommissionsService()

export class CommissionsController {
  async list(req: Request, res: Response) {
    try {
      const { producerId, status, period, page, limit } = req.query

      const result = await commissionsService.findAll({
        producerId: producerId ? Number(producerId) : undefined,
        status: status as string | undefined,
        period: period as string | undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      })

      return res.status(200).json({
        success: true,
        ...result,
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener comisiones',
      })
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const commission = await commissionsService.findById(id)

      return res.status(200).json({
        success: true,
        data: commission,
      })
    } catch (error: any) {
      const status = error.message === 'Comisión no encontrada' ? 404 : 500
      return res.status(status).json({
        success: false,
        message: error.message || 'Error al obtener comisión',
      })
    }
  }

  async create(req: Request, res: Response) {
    try {
      const commission = await commissionsService.create(req.body)

      return res.status(201).json({
        success: true,
        data: commission,
        message: 'Comisión creada exitosamente',
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al crear comisión',
      })
    }
  }

  async markAsPaid(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const commission = await commissionsService.markAsPaid(id)

      return res.status(200).json({
        success: true,
        data: commission,
        message: 'Comisión marcada como pagada',
      })
    } catch (error: any) {
      const message = error.message || 'Error al marcar comisión como pagada'
      const status = message.includes('no encontrada')
        ? 404
        : message.includes('ya fue pagada') || message.includes('anulada')
          ? 400
          : 500
      return res.status(status).json({
        success: false,
        message,
      })
    }
  }

  async summary(_req: Request, res: Response) {
    try {
      const result = await commissionsService.getSummaryByProducer()

      return res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener resumen de comisiones',
      })
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const permanent = req.query.permanent === 'true'
      const commission = await commissionsService.delete(id, permanent)
      
      const message = permanent
        ? 'Comisión eliminada permanentemente de la base de datos'
        : 'Comisión anulada exitosamente'
      
      return res.json({ success: true, message, data: commission })
    } catch (error: any) {
      const status = error.message === 'Comisión no encontrada' ? 404 : 500
      return res.status(status).json({
        success: false,
        message: error.message || 'Error al eliminar comisión',
      })
    }
  }
}
