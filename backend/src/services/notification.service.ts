import prisma from '../config/database'
import { sendEmail } from '../config/email'
import { policyExpiredEmail, policyExpiringSoonEmail } from '../utils/emailTemplates'
import { generatePolicyPDF } from './pdf/policy.pdf'
import { formatDate } from '../utils/pdf'

interface PaymentReminderData {
  clientName: string
  clientEmail: string
  policyNumber: string
  amount: number
  dueDate: Date
  concept: string
}

export class NotificationService {
  /**
   * Send payment reminder to client
   */
  static async sendPaymentReminderToClient(data: PaymentReminderData): Promise<boolean> {
    try {
      if (!data.clientEmail) {
        console.log(`Client ${data.clientName} has no email address`)
        return false
      }

      const daysUntilDue = Math.ceil(
        (data.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )

      const subject = `Recordatorio de Pago - Póliza ${data.policyNumber}`
      const html = `
        <h2>Recordatorio de Pago</h2>
        <p>Estimado/a ${data.clientName},</p>
        <p>Le recordamos que tiene un pago pendiente:</p>
        <ul>
          <li><strong>Póliza:</strong> ${data.policyNumber}</li>
          <li><strong>Concepto:</strong> ${data.concept}</li>
          <li><strong>Monto:</strong> RD$${data.amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</li>
          <li><strong>Fecha de Vencimiento:</strong> ${data.dueDate.toLocaleDateString('es-DO')}</li>
          <li><strong>Días Restantes:</strong> ${daysUntilDue} día${daysUntilDue !== 1 ? 's' : ''}</li>
        </ul>
        <p>Por favor, realice su pago antes de la fecha de vencimiento para mantener su póliza vigente.</p>
        <p>Si ya realizó el pago, por favor ignore este mensaje.</p>
        <br>
        <p>Saludos cordiales,</p>
        <p><strong>SeguroPro</strong><br>Corredora de Seguros</p>
      `

      await sendEmail({
        to: data.clientEmail,
        subject,
        html,
      })

      console.log(`Payment reminder sent to ${data.clientEmail} for policy ${data.policyNumber}`)
      return true
    } catch (error) {
      console.error('Error sending payment reminder to client:', error)
      return false
    }
  }

  /**
   * Send payment reminder notification to internal users
   */
  static async sendPaymentReminderToUsers(data: PaymentReminderData): Promise<boolean> {
    try {
      // Get all active users with notification preferences
      const users = await prisma.user.findMany({
        where: {
          status: 'ACTIVO',
          email: { not: null },
        },
        select: {
          email: true,
          name: true,
        },
      })

      if (users.length === 0) {
        console.log('No active users to notify')
        return false
      }

      const daysUntilDue = Math.ceil(
        (data.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )

      const subject = `Recordatorio de Pago Próximo - ${data.clientName}`
      const html = `
        <h2>Recordatorio de Pago Próximo</h2>
        <p>Hola,</p>
        <p>El siguiente pago está próximo a vencer:</p>
        <ul>
          <li><strong>Cliente:</strong> ${data.clientName}</li>
          <li><strong>Póliza:</strong> ${data.policyNumber}</li>
          <li><strong>Concepto:</strong> ${data.concept}</li>
          <li><strong>Monto:</strong> RD$${data.amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</li>
          <li><strong>Fecha de Vencimiento:</strong> ${data.dueDate.toLocaleDateString('es-DO')}</li>
          <li><strong>Días Restantes:</strong> ${daysUntilDue} día${daysUntilDue !== 1 ? 's' : ''}</li>
        </ul>
        <p>Considera hacer seguimiento con el cliente para asegurar el pago oportuno.</p>
        <br>
        <p>Sistema de Notificaciones - <strong>SeguroPro</strong></p>
      `

      // Send to all users
      for (const user of users) {
        if (user.email) {
          await sendEmail({
            to: user.email,
            subject,
            html,
          })
        }
      }

      console.log(`Payment reminder sent to ${users.length} user(s) for policy ${data.policyNumber}`)
      return true
    } catch (error) {
      console.error('Error sending payment reminder to users:', error)
      return false
    }
  }

  /**
   * Process payment reminders - Check for payments that need reminders
   */
  static async processPaymentReminders(): Promise<void> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Get all pending payments that haven't sent reminder yet
      const payments = await prisma.payment.findMany({
        where: {
          status: 'PENDIENTE',
          reminderSent: false,
          dueDate: { not: null },
        },
        include: {
          client: {
            select: {
              name: true,
              email: true,
            },
          },
          policy: {
            select: {
              policyNumber: true,
            },
          },
        },
      })

      for (const payment of payments) {
        if (!payment.dueDate) continue

        const dueDate = new Date(payment.dueDate)
        const reminderDate = new Date(dueDate)
        reminderDate.setDate(reminderDate.getDate() - (payment.reminderDays || 7))
        reminderDate.setHours(0, 0, 0, 0)

        // Check if today is the reminder date
        if (today >= reminderDate && today < dueDate) {
          const reminderData: PaymentReminderData = {
            clientName: payment.client.name,
            clientEmail: payment.client.email || '',
            policyNumber: payment.policy.policyNumber,
            amount: Number(payment.amount),
            dueDate: dueDate,
            concept: payment.concept || 'Pago de póliza',
          }

          // Send to client
          const clientSent = await this.sendPaymentReminderToClient(reminderData)

          // Send to users
          const usersSent = await this.sendPaymentReminderToUsers(reminderData)

          // Mark as sent if at least one was successful
          if (clientSent || usersSent) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: { reminderSent: true },
            })
          }
        }
      }

      console.log(`Processed payment reminders: ${payments.length} payments checked`)
    } catch (error) {
      console.error('Error processing payment reminders:', error)
      throw error
    }
  }

  /**
   * Send policy expiration reminder (already expired)
   */
  static async sendPolicyExpiredReminder(policyId: number): Promise<boolean> {
    try {
      const policy = await prisma.policy.findUnique({
        where: { id: policyId },
        include: {
          client: { select: { name: true, email: true } },
          insurer: { select: { name: true } },
          insuranceType: { select: { name: true } },
        },
      })

      if (!policy) {
        console.log(`Policy ${policyId} not found`)
        return false
      }

      if (!policy.client?.email) {
        console.log(`Client for policy ${policy.policyNumber} has no email`)
        return false
      }

      // Generate email template
      const emailTemplate = policyExpiredEmail({
        clientName: policy.client.name,
        policyNumber: policy.policyNumber,
        endDate: formatDate(policy.endDate),
        insurerName: policy.insurer?.name || '',
        insuranceType: policy.insuranceType?.name || '',
        premium: Number(policy.premium),
      })

      // Send email
      await sendEmail({
        to: policy.client.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      })

      console.log(`Policy expired reminder sent for policy ${policy.policyNumber}`)
      return true
    } catch (error) {
      console.error('Error sending policy expired reminder:', error)
      return false
    }
  }

  /**
   * Send policy expiring soon reminder
   */
  static async sendPolicyExpiringReminder(policyId: number, daysLeft: number): Promise<boolean> {
    try {
      const policy = await prisma.policy.findUnique({
        where: { id: policyId },
        include: {
          client: { select: { name: true, email: true } },
          insurer: { select: { name: true } },
          insuranceType: { select: { name: true } },
        },
      })

      if (!policy) {
        console.log(`Policy ${policyId} not found`)
        return false
      }

      if (!policy.client?.email) {
        console.log(`Client for policy ${policy.policyNumber} has no email`)
        return false
      }

      // Generate email template
      const emailTemplate = policyExpiringSoonEmail({
        clientName: policy.client.name,
        policyNumber: policy.policyNumber,
        endDate: formatDate(policy.endDate),
        daysLeft,
        insurerName: policy.insurer?.name || '',
        insuranceType: policy.insuranceType?.name || '',
        premium: Number(policy.premium),
      })

      // Send email
      await sendEmail({
        to: policy.client.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      })

      console.log(`Policy expiring reminder sent for policy ${policy.policyNumber} (${daysLeft} days left)`)
      return true
    } catch (error) {
      console.error('Error sending policy expiring reminder:', error)
      return false
    }
  }

  /**
   * Process policy expiration reminders - Check for policies that need reminders
   */
  static async processPolicyExpirationReminders(): Promise<void> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const thirtyDaysFromNow = new Date(today)
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

      // Get all VIGENTE policies
      const policies = await prisma.policy.findMany({
        where: {
          status: 'VIGENTE',
        },
        include: {
          client: { select: { name: true, email: true } },
          insurer: { select: { name: true } },
          insuranceType: { select: { name: true } },
        },
      })

      let expiredCount = 0
      let expiringCount = 0

      for (const policy of policies) {
        const endDate = new Date(policy.endDate)
        endDate.setHours(0, 0, 0, 0)

        const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        // Check if already sent notification today
        const existingNotification = await prisma.notification.findFirst({
          where: {
            policyId: policy.id,
            type: daysUntilExpiry < 0 ? 'POLICY_EXPIRED' : 'POLICY_EXPIRING',
            createdAt: {
              gte: today,
            },
          },
        })

        if (existingNotification) {
          console.log(`Notification already sent today for policy ${policy.policyNumber}`)
          continue
        }

        // Policy already expired
        if (daysUntilExpiry < 0) {
          const sent = await this.sendPolicyExpiredReminder(policy.id)
          if (sent) {
            await prisma.notification.create({
              data: {
                type: 'POLICY_EXPIRED',
                policyId: policy.id,
                channel: 'EMAIL',
                recipient: policy.client?.email || '',
                message: `Póliza ${policy.policyNumber} vencida`,
                status: 'ENVIADA',
                sentAt: new Date(),
              },
            })
            expiredCount++
          }
        }
        // Policy expiring within 30 days
        else if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30) {
          const sent = await this.sendPolicyExpiringReminder(policy.id, daysUntilExpiry)
          if (sent) {
            await prisma.notification.create({
              data: {
                type: 'POLICY_EXPIRING',
                policyId: policy.id,
                channel: 'EMAIL',
                recipient: policy.client?.email || '',
                message: `Póliza ${policy.policyNumber} vence en ${daysUntilExpiry} días`,
                status: 'ENVIADA',
                sentAt: new Date(),
              },
            })
            expiringCount++
          }
        }
      }

      console.log(`Processed policy expiration reminders: ${expiredCount} expired, ${expiringCount} expiring soon`)
    } catch (error) {
      console.error('Error processing policy expiration reminders:', error)
      throw error
    }
  }
}
