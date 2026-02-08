import { Request, Response } from 'express'
import { PaymentsService } from './payments.service'

const paymentsService = new PaymentsService()

export class PaymentsController {
  async list(req: Request, res: Response) {
    try {
      const { clientId, policyId, status, page, limit } = req.query

      const result = await paymentsService.findAll({
        clientId: clientId ? Number(clientId) : undefined,
        policyId: policyId ? Number(policyId) : undefined,
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
        message: error.message || 'Error al obtener pagos',
      })
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const payment = await paymentsService.findById(id)

      return res.status(200).json({
        success: true,
        data: payment,
      })
    } catch (error: any) {
      const status = error.message === 'Pago no encontrado' ? 404 : 500
      return res.status(status).json({
        success: false,
        message: error.message || 'Error al obtener pago',
      })
    }
  }

  async create(req: Request, res: Response) {
    try {
      const payment = await paymentsService.create({
        ...req.body,
        createdBy: req.user?.id,
      })

      return res.status(201).json({
        success: true,
        data: payment,
        message: 'Pago creado exitosamente',
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al crear pago',
      })
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const payment = await paymentsService.update(id, req.body)

      return res.status(200).json({
        success: true,
        data: payment,
        message: 'Pago actualizado exitosamente',
      })
    } catch (error: any) {
      const status = error.message === 'Pago no encontrado' ? 404 : 500
      return res.status(status).json({
        success: false,
        message: error.message || 'Error al actualizar pago',
      })
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const payment = await paymentsService.delete(id)
      const amount = Number(payment.amount)
      return res.json({
        success: true,
        message: `Pago de ${amount.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })} anulado exitosamente`,
        data: payment
      })
    } catch (error: any) {
      const status = error.message === 'Pago no encontrado' ? 404 : 500
      return res.status(status).json({
        success: false,
        message: error.message || 'Error al eliminar pago',
      })
    }
  }

  async overdue(_req: Request, res: Response) {
    try {
      const payments = await paymentsService.getOverdue()

      return res.status(200).json({
        success: true,
        data: payments,
        count: payments.length,
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener pagos vencidos',
      })
    }
  }

  async upcoming(req: Request, res: Response) {
    try {
      const days = req.query.days ? Number(req.query.days) : 15
      const payments = await paymentsService.getUpcoming(days)

      return res.status(200).json({
        success: true,
        data: payments,
        count: payments.length,
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener pagos próximos',
      })
    }
  }

  async receivables(_req: Request, res: Response) {
    try {
      const result = await paymentsService.getReceivables()

      return res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener cuentas por cobrar',
      })
    }
  }

  async regenerateMissingPayments(req: Request, res: Response) {
    try {
      const policyId = Number(req.params.policyId)
      const result = await paymentsService.regenerateMissingPayments(
        policyId,
        req.user?.id
      )

      return res.status(200).json({
        success: true,
        ...result,
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al regenerar pagos',
      })
    }
  }
}
