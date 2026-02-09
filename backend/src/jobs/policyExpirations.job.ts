import cron from 'node-cron'
import { NotificationService } from '../services/notification.service'

/**
 * Schedule policy expiration reminder notifications
 * Runs daily at 8:00 AM (before payment reminders)
 */
export function schedulePolicyExpirationReminders() {
  // Run every day at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('Running policy expiration reminders job...', new Date().toISOString())
    try {
      await NotificationService.processPolicyExpirationReminders()
      console.log('Policy expiration reminders job completed successfully')
    } catch (error) {
      console.error('Policy expiration reminders job failed:', error)
    }
  })

  console.log('Policy expiration reminders job scheduled (daily at 8:00 AM)')
}

/**
 * Run policy expiration reminders immediately (for testing)
 */
export async function runPolicyExpirationsNow() {
  console.log('Running policy expiration reminders manually...', new Date().toISOString())
  try {
    await NotificationService.processPolicyExpirationReminders()
    console.log('Policy expiration reminders completed successfully')
    return { success: true, message: 'Policy expiration reminders sent successfully' }
  } catch (error) {
    console.error('Policy expiration reminders failed:', error)
    return { success: false, message: 'Failed to send policy expiration reminders', error }
  }
}
