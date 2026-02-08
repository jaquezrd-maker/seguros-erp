import app from './app'
import logger from './utils/logger'
import { schedulePaymentReminders } from './jobs/paymentReminders.job'

const PORT = parseInt(process.env.PORT || '3000')

app.listen(PORT, () => {
  logger.info(`SeguroPro API running on port ${PORT}`)
  
  // Initialize scheduled jobs
  schedulePaymentReminders()
  logger.info('Scheduled jobs initialized')
})
