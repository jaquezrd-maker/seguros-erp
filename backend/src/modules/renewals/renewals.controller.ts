import { Request, Response } from 'express'
import { RenewalsService } from './renewals.service'
import { generateRenewalNoticePDF } from '../../services/pdf/renewal.pdf'
import { sendEmailWithDebug, formatEmailErrorResponse } from '../../utils/emailHelper'
import { renewalNoticeEmail } from '../../utils/emailTemplates'
import { formatDate } from '../../utils/pdf'

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
  }

  async generatePDF(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const pdfBuffer = await generateRenewalNoticePDF(id)

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="renovacion-${id}.pdf"`)
      res.send(pdfBuffer)
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al generar PDF',
      })
    }
  }

  async previewEmail(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const { recipients, includeAttachment } = req.query

      // Fetch renewal data
      const renewal = await renewalsService.findById(id)

      if (!renewal) {
        return res.status(404).json({
          success: false,
          message: 'Renovación no encontrada',
        })
      }

      // Determine email recipients
      const emailRecipients: string[] = []
      const recipientsList = typeof recipients === 'string' ? recipients.split(',') : []

      if (recipientsList.includes('client') && renewal.policy?.client?.email) {
        emailRecipients.push(renewal.policy.client.email)
      }
      if (recipientsList.includes('insurer') && renewal.policy?.insurer?.email) {
        emailRecipients.push(renewal.policy.insurer.email)
      }
      if (recipientsList.includes('internal')) {
        const internalEmail = process.env.INTERNAL_EMAIL || 'admin@seguropro.com'
        emailRecipients.push(internalEmail)
      }

      // Generate email content
      const emailTemplate = renewalNoticeEmail({
        clientName: renewal.policy?.client?.name || 'Cliente',
        policyNumber: renewal.policy?.policyNumber || '',
        originalEndDate: formatDate(renewal.originalEndDate),
        newEndDate: renewal.newEndDate ? formatDate(renewal.newEndDate) : undefined,
        newPremium: renewal.newPremium ? Number(renewal.newPremium) : undefined,
        currentPremium: Number(renewal.policy?.premium || 0),
        insurerName: renewal.policy?.insurer?.name || '',
        insuranceType: renewal.policy?.insuranceType?.name || '',
        status: renewal.status,
      })

      // Return preview data
      return res.json({
        success: true,
        data: {
          recipients: emailRecipients,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          hasAttachment: includeAttachment === 'true',
          policyNumber: renewal.policy?.policyNumber,
        }
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al cargar preview',
      })
    }
  }

  async sendEmail(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const { recipients, includeAttachment, customSubject, customHtml } = req.body

      // Fetch renewal data
      const renewal = await renewalsService.findById(id)

      if (!renewal) {
        return res.status(404).json({
          success: false,
          message: 'Renovación no encontrada',
        })
      }

      // Determine email recipients
      const emailRecipients: string[] = []
      if (recipients.includes('client') && renewal.policy?.client?.email) {
        emailRecipients.push(renewal.policy.client.email)
      }
      if (recipients.includes('insurer') && renewal.policy?.insurer?.email) {
        emailRecipients.push(renewal.policy.insurer.email)
      }
      if (recipients.includes('internal')) {
        const internalEmail = process.env.INTERNAL_EMAIL || 'admin@seguropro.com'
        emailRecipients.push(internalEmail)
      }

      if (emailRecipients.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No se encontraron destinatarios con email válido',
        })
      }

      // Generate PDF attachment if requested
      let attachments = undefined
      if (includeAttachment) {
        const pdfBuffer = await generateRenewalNoticePDF(id)
        attachments = [
          {
            filename: `renovacion-${renewal.policy?.policyNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ]
      }

      // Generate email content
      const emailTemplate = renewalNoticeEmail({
        clientName: renewal.policy?.client?.name || 'Cliente',
        policyNumber: renewal.policy?.policyNumber || '',
        originalEndDate: formatDate(renewal.originalEndDate),
        newEndDate: renewal.newEndDate ? formatDate(renewal.newEndDate) : undefined,
        newPremium: renewal.newPremium ? Number(renewal.newPremium) : undefined,
        currentPremium: Number(renewal.policy?.premium || 0),
        insurerName: renewal.policy?.insurer?.name || '',
        insuranceType: renewal.policy?.insuranceType?.name || '',
        status: renewal.status,
      })

      // Use custom subject/html if provided, otherwise use template
      const emailSubject = customSubject || emailTemplate.subject
      const emailHtml = customHtml || emailTemplate.html

      // Send email with debug
      const result = await sendEmailWithDebug(
        {
          to: emailRecipients,
          subject: emailSubject,
          html: emailHtml,
          attachments,
        },
        {
          module: 'renewals',
          action: 'send_reminder',
          recordId: id,
        }
      )

      return res.json(result)
    } catch (error: any) {
      return res.status(500).json(formatEmailErrorResponse(error))
    }
  }
}