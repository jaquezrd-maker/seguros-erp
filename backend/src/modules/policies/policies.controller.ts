import { Request, Response, NextFunction } from 'express'
import { policiesService } from './policies.service'
import { PolicyStatus } from '@prisma/client'
import { generatePolicyPDF } from '../../services/pdf/policy.pdf'
import { sendEmail } from '../../config/email'
import { policyExpiredEmail, policyExpiringSoonEmail } from '../../utils/emailTemplates'
import { formatDate } from '../../utils/pdf'

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

  async generatePDF(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      const pdfBuffer = await generatePolicyPDF(id)

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="poliza-${id}.pdf"`)
      res.send(pdfBuffer)
    } catch (error) {
      next(error)
    }
  },

  async sendEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      const { recipients, includeAttachment } = req.body

      // Fetch policy data
      const policy = await policiesService.findById(id)

      // Determine email recipients
      const emailRecipients: string[] = []
      if (recipients.includes('client') && policy.client?.email) {
        emailRecipients.push(policy.client.email)
      }
      if (recipients.includes('insurer') && policy.insurer?.email) {
        emailRecipients.push(policy.insurer.email)
      }
      if (recipients.includes('internal')) {
        // Add internal recipients from env or default
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
        const pdfBuffer = await generatePolicyPDF(id)
        attachments = [
          {
            filename: `poliza-${policy.policyNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ]
      }

      // Determine email content based on policy status
      const today = new Date()
      const endDate = new Date(policy.endDate)
      const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      let emailTemplate
      if (policy.status === 'VENCIDA' || daysUntilExpiry < 0) {
        emailTemplate = policyExpiredEmail({
          clientName: policy.client?.name || 'Cliente',
          policyNumber: policy.policyNumber,
          endDate: formatDate(policy.endDate),
          insurerName: policy.insurer?.name || '',
          insuranceType: policy.insuranceType?.name || '',
          premium: Number(policy.premium),
        })
      } else {
        emailTemplate = policyExpiringSoonEmail({
          clientName: policy.client?.name || 'Cliente',
          policyNumber: policy.policyNumber,
          endDate: formatDate(policy.endDate),
          daysLeft: Math.max(0, daysUntilExpiry),
          insurerName: policy.insurer?.name || '',
          insuranceType: policy.insuranceType?.name || '',
          premium: Number(policy.premium),
        })
      }

      // Send email
      await sendEmail({
        to: emailRecipients,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        attachments,
      })

      res.json({
        success: true,
        message: `Email enviado a ${emailRecipients.length} destinatario(s)`,
      })
    } catch (error) {
      next(error)
    }
  },
}
