import { Request, Response, NextFunction } from 'express'
import { clientsService } from './clients.service'
import { ClientType, ClientStatus } from '@prisma/client'
import { parsePagination } from '../../utils/pagination'
import { generateClientStatementPDF } from '../../services/pdf/client.pdf'
import { sendEmailWithDebug } from '../../utils/emailHelper'
import { genericNotificationEmail } from '../../utils/emailTemplates'
import { formatCurrency } from '../../utils/pdf'
import { lookupRNC } from '../../utils/rncLookup'

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

  async generatePDF(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string)

      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID inválido' })
      }

      const pdfBuffer = await generateClientStatementPDF(id)

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="estado-cuenta-cliente-${id}.pdf"`)
      res.send(pdfBuffer)
    } catch (error) {
      next(error)
    }
  },

  async previewEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string)
      const { recipients, includeAttachment } = req.query

      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID inválido' })
      }

      // Fetch client data
      const client = await clientsService.findById(id)

      // Determine email recipients
      const emailRecipients: string[] = []
      const recipientsList = typeof recipients === 'string' ? recipients.split(',') : []

      if (recipientsList.includes('client') && client.email) {
        emailRecipients.push(client.email)
      }
      if (recipientsList.includes('internal')) {
        const internalEmail = process.env.INTERNAL_EMAIL || 'admin@seguropro.com'
        emailRecipients.push(internalEmail)
      }

      // Calculate balance and active policies count
      const balance = formatCurrency(client.balance?.pending || 0)
      const activePoliciesCount = client.policies?.filter((p: any) => p.status === 'VIGENTE').length || 0

      // Generate email content
      const emailTemplate = genericNotificationEmail({
        recipientName: client.name,
        subject: 'Estado de Cuenta - SeguroPro',
        title: 'Estado de Cuenta del Cliente',
        message: `Adjunto encontrará su estado de cuenta actualizado con la información de sus pólizas activas y balance pendiente.<br><br>
          <strong>Balance Pendiente:</strong> ${balance}<br>
          <strong>Pólizas Activas:</strong> ${activePoliciesCount}<br><br>
          Si tiene alguna consulta, no dude en contactarnos.`,
      })

      return res.json({
        success: true,
        data: {
          recipients: emailRecipients,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          hasAttachment: includeAttachment === 'true',
        },
      })
    } catch (error) {
      next(error)
    }
  },

  async sendEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string)
      const { recipients, includeAttachment, customSubject, customHtml } = req.body

      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID inválido' })
      }

      // Fetch client data
      const client = await clientsService.findById(id)

      // Determine email recipients
      const emailRecipients: string[] = []
      if (recipients.includes('client') && client.email) {
        emailRecipients.push(client.email)
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
        const pdfBuffer = await generateClientStatementPDF(id)
        attachments = [
          {
            filename: `estado-cuenta-${client.cedulaRnc || client.id}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ]
      }

      // Calculate balance and active policies count
      const balance = formatCurrency(client.balance?.pending || 0)
      const activePoliciesCount = client.policies?.filter((p: any) => p.status === 'VIGENTE').length || 0

      // Generate email content
      const emailTemplate = genericNotificationEmail({
        recipientName: client.name,
        subject: 'Estado de Cuenta - SeguroPro',
        title: 'Estado de Cuenta del Cliente',
        message: `Adjunto encontrará su estado de cuenta actualizado con la información de sus pólizas activas y balance pendiente.<br><br>
          <strong>Balance Pendiente:</strong> ${balance}<br>
          <strong>Pólizas Activas:</strong> ${activePoliciesCount}<br><br>
          Si tiene alguna consulta, no dude en contactarnos.`,
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
          module: 'clients',
          action: 'send_statement',
          recordId: id,
        }
      )

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: result.message || 'Error al enviar email',
        })
      }

      return res.json({
        success: true,
        message: result.message,
        data: {
          recipients: emailRecipients,
        },
      })
    } catch (error) {
      next(error)
    }
  },

  async lookupRNC(req: Request, res: Response, next: NextFunction) {
    try {
      const { rnc } = req.params

      if (!rnc) {
        return res.status(400).json({ success: false, message: 'RNC/Cédula es requerido' })
      }

      const rncData = await lookupRNC(rnc)

      if (!rncData) {
        return res.status(404).json({ success: false, message: 'RNC/Cédula no encontrado en la base de datos DGII' })
      }

      res.json({ success: true, data: rncData })
    } catch (error) {
      next(error)
    }
  },
}
