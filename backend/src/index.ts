import 'dotenv/config'
import app from './app'
import logger from './utils/logger'
import { schedulePaymentReminders } from './jobs/paymentReminders.job'
import { schedulePolicyExpirationReminders } from './jobs/policyExpirations.job'

const PORT = parseInt(process.env.PORT || '3000')

app.listen(PORT, () => {
  logger.info(`SeguroPro API running on port ${PORT}`)
  
  // Initialize scheduled jobs
  schedulePolicyExpirationReminders() // 8:00 AM
  schedulePaymentReminders() // 9:00 AM
  logger.info('Scheduled jobs initialized')
})
