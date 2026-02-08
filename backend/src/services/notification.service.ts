import prisma from '../config/database'
import { sendEmail } from '../config/email'

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
}
