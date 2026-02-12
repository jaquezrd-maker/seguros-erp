import { Request, Response } from 'express'
import { EventsService } from './events.service'
import { EventType } from '@prisma/client'

const eventsService = new EventsService()

export class EventsController {
  async list(req: Request, res: Response) {
    try {
      const { startDate, endDate, type, userId, page, limit } = req.query

      const result = await eventsService.findAll({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        type: type as EventType | undefined,
        userId: userId ? Number(userId) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 100,
      })

      return res.status(200).json({
        success: true,
        ...result,
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener eventos',
      })
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const event = await eventsService.findById(id)

      return res.status(200).json({
        success: true,
        data: event,
      })
    } catch (error: any) {
      const status = error.message === 'Evento no encontrado' ? 404 : 500
      return res.status(status).json({
        success: false,
        message: error.message || 'Error al obtener evento',
      })
    }
  }

  async create(req: Request, res: Response) {
    try {
      const event = await eventsService.create({
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        userId: req.user!.id,
        companyId: req.user!.companyId,
      })

      return res.status(201).json({
        success: true,
        data: event,
        message: 'Evento creado exitosamente',
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al crear evento',
      })
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const updateData = {
        ...req.body,
      }

      if (req.body.startDate) {
        updateData.startDate = new Date(req.body.startDate)
      }
      if (req.body.endDate) {
        updateData.endDate = new Date(req.body.endDate)
      }

      const event = await eventsService.update(id, updateData)

      return res.status(200).json({
        success: true,
        data: event,
        message: 'Evento actualizado exitosamente',
      })
    } catch (error: any) {
      const status = error.message === 'Evento no encontrado' ? 404 : 500
      return res.status(status).json({
        success: false,
        message: error.message || 'Error al actualizar evento',
      })
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      await eventsService.delete(id)

      return res.status(200).json({
        success: true,
        message: 'Evento eliminado exitosamente',
      })
    } catch (error: any) {
      const status = error.message === 'Evento no encontrado' ? 404 : 500
      return res.status(status).json({
        success: false,
        message: error.message || 'Error al eliminar evento',
      })
    }
  }

  async getCalendar(req: Request, res: Response) {
    try {
      const { startDate, endDate, userId } = req.query

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Las fechas de inicio y fin son requeridas',
        })
      }

      const events = await eventsService.getCalendarEvents(
        new Date(startDate as string),
        new Date(endDate as string),
        userId ? Number(userId) : undefined
      )

      return res.status(200).json({
        success: true,
        data: events,
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener calendario',
      })
    }
  }
}
