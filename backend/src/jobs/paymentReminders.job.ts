import cron from 'node-cron'
import { NotificationService } from '../services/notification.service'

/**
 * Schedule payment reminder notifications
 * Runs daily at 9:00 AM
 */
export function schedulePaymentReminders() {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Running payment reminders job...', new Date().toISOString())
    try {
      await NotificationService.processPaymentReminders()
      console.log('Payment reminders job completed successfully')
    } catch (error) {
      console.error('Payment reminders job failed:', error)
    }
  })

  console.log('Payment reminders job scheduled (daily at 9:00 AM)')
}

/**
 * Run payment reminders immediately (for testing)
 */
export async function runPaymentRemindersNow() {
  console.log('Running payment reminders manually...', new Date().toISOString())
  try {
    await NotificationService.processPaymentReminders()
    console.log('Payment reminders completed successfully')
    return { success: true, message: 'Payment reminders sent successfully' }
  } catch (error) {
    console.error('Payment reminders failed:', error)
    return { success: false, message: 'Failed to send payment reminders', error }
  }
}
