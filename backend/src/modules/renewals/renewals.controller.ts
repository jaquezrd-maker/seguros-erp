import { Request, Response } from 'express'
import { RenewalsService } from './renewals.service'

const renewalsService = new RenewalsService()

export class RenewalsController {
  async list(req: Request, res: Response) {
    try {
      const { status, page, limit } = req.query

      const result = await renewalsService.findAll({
        status: status as string | undefined,
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
        message: error.message || 'Error al obtener renovaciones',
      })
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const renewal = await renewalsService.findById(id)

      return res.status(200).json({
        success: true,
        data: renewal,
      })
    } catch (error: any) {
      const status = error.message === 'Renovación no encontrada' ? 404 : 500
      return res.status(status).json({
        success: false,
        message: error.message || 'Error al obtener renovación',
      })
    }
  }

  async pending(_req: Request, res: Response) {
    try {
      const renewals = await renewalsService.getPending()

      return res.status(200).json({
        success: true,
        data: renewals,
        count: renewals.length,
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener renovaciones pendientes',
      })
    }
  }

  async process(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const processedBy = req.user!.id

      const renewal = await renewalsService.process(id, req.body, processedBy)

      return res.status(200).json({
        success: true,
        data: renewal,
        message: 'Renovación procesada exitosamente',
      })
    } catch (error: any) {
      const message = error.message || 'Error al procesar renovación'
      const status = message.includes('no encontrada')
        ? 404
        : message.includes('Solo se pueden')
          ? 400
          : 500
      return res.status(status).json({
        success: false,
        message,
      })
    }
  }

  async notify(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const result = await renewalsService.notify(id)

      return res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      const status = error.message === 'Renovación no encontrada' ? 404 : 500
      return res.status(status).json({
        success: false,
        message: error.message || 'Error al notificar renovación',
      })
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const renewal = await renewalsService.update(id, req.body)

      return res.status(200).json({
        success: true,
        data: renewal,
        message: 'Renovación actualizada exitosamente',
      })
    } catch (error: any) {
      const message = error.message || 'Error al actualizar renovación'
      const status = message.includes('no encontrada')
        ? 404
        : message.includes('Solo se pueden')
          ? 400
          : 500
      return res.status(status).json({
        success: false,
        message,
      })
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const result = await renewalsService.delete(id)

      return res.status(200).json({
        success: true,
        message: result.message,
      })
    } catch (error: any) {
      const message = error.message || 'Error al eliminar renovación'
      const status = message.includes('no encontrada')
        ? 404
        : message.includes('No se pueden eliminar')
          ? 400
          : 500
      return res.status(status).json({
        success: false,
        message,
      })
    }
  }

  async generate(req: Request, res: Response) {
    try {
      const daysAhead = req.query.days ? Number(req.query.days) : 60
      const result = await renewalsService.generateRenewals(daysAhead)

      return res.status(200).json({
        success: true,
        data: result,
        message: `Se generaron ${result.created} renovaciones (${result.skipped} omitidas)`,
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al generar renovaciones',
      })
    }
  }}