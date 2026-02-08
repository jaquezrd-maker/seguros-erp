import { Request, Response } from 'express'
import { NotificationService } from '../../services/notification.service'
import { runPaymentRemindersNow } from '../../jobs/paymentReminders.job'
import prisma from '../../config/database'

export const notificationsController = {
  /**
   * Trigger payment reminders manually
   */
  async triggerPaymentReminders(req: Request, res: Response) {
    try {
      const result = await runPaymentRemindersNow()
      
      res.json({
        success: true,
        message: 'Payment reminders triggered successfully',
        data: result,
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to trigger payment reminders',
        error: error.message,
      })
    }
  },

  /**
   * Get notification statistics
   */
  async getStatistics(req: Request, res: Response) {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [
        totalPendingPayments,
        paymentsWithReminders,
        remindersSent,
        upcomingReminders,
      ] = await Promise.all([
        prisma.payment.count({
          where: { status: 'PENDIENTE' },
        }),
        prisma.payment.count({
          where: {
            status: 'PENDIENTE',
            reminderDays: { not: null },
          },
        }),
        prisma.payment.count({
          where: {
            status: 'PENDIENTE',
            reminderSent: true,
          },
        }),
        prisma.payment.count({
          where: {
            status: 'PENDIENTE',
            reminderSent: false,
            dueDate: {
              gte: today,
              lte: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ])

      res.json({
        success: true,
        data: {
          totalPendingPayments,
          paymentsWithReminders,
          remindersSent,
          upcomingReminders,
        },
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve notification statistics',
        error: error.message,
      })
    }
  },

  /**
   * Get upcoming payment reminders
   */
  async getUpcomingReminders(req: Request, res: Response) {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const thirtyDaysFromNow = new Date(today)
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

      const payments = await prisma.payment.findMany({
        where: {
          status: 'PENDIENTE',
          reminderSent: false,
          dueDate: {
            gte: today,
            lte: thirtyDaysFromNow,
          },
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          policy: {
            select: {
              id: true,
              policyNumber: true,
              insurer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
        take: 50,
      })

      const reminders = payments.map((payment) => {
        const dueDate = new Date(payment.dueDate!)
        const reminderDate = new Date(dueDate)
        reminderDate.setDate(reminderDate.getDate() - (payment.reminderDays || 7))

        return {
          id: payment.id,
          client: payment.client,
          policy: payment.policy,
          amount: payment.amount,
          dueDate: payment.dueDate,
          reminderDate,
          reminderDays: payment.reminderDays,
          concept: payment.concept,
        }
      })

      res.json({
        success: true,
        data: reminders,
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve upcoming reminders',
        error: error.message,
      })
    }
  },
}
