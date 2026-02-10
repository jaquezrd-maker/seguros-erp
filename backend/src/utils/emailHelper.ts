import { sendEmail, EMAIL_FROM } from '../config/email'
import type { EmailAttachment } from '../config/email'

interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  attachments?: EmailAttachment[]
}

interface EmailDebugInfo {
  module: string
  action: string
  recipients: string[]
  from: string
  subject: string
  hasAttachments: boolean
  attachmentCount?: number
  timestamp: string
}

/**
 * Wrapper around sendEmail with detailed debugging and error handling
 */
export async function sendEmailWithDebug(
  options: SendEmailOptions,
  context: { module: string; action: string; recordId?: number }
) {
  const recipients = Array.isArray(options.to) ? options.to : [options.to]

  const debugInfo: EmailDebugInfo = {
    module: context.module,
    action: context.action,
    recipients,
    from: EMAIL_FROM,
    subject: options.subject,
    hasAttachments: !!options.attachments?.length,
    attachmentCount: options.attachments?.length,
    timestamp: new Date().toISOString(),
  }

  console.log(`[Email Debug] Starting email send attempt:`, JSON.stringify(debugInfo, null, 2))

  // Validate recipients
  const invalidEmails = recipients.filter((email) => !isValidEmail(email))
  if (invalidEmails.length > 0) {
    const error = new Error(`Invalid email addresses: ${invalidEmails.join(', ')}`)
    console.error('[Email Debug] Validation failed:', error.message)
    throw error
  }

  try {
    console.log(`[Email Debug] Calling SendGrid API...`)
    const result = await sendEmail(options)

    console.log(`[Email Debug] SUCCESS - Email sent`, {
      module: context.module,
      action: context.action,
      recipientCount: recipients.length,
      messageId: result?.[0]?.headers?.['x-message-id'],
    })

    return {
      success: true,
      message: `Email enviado exitosamente a ${recipients.length} destinatario(s)`,
      debug: debugInfo,
    }
  } catch (error: any) {
    console.error(`[Email Debug] FAILED - Error sending email:`, {
      module: context.module,
      action: context.action,
      errorMessage: error.message,
      errorCode: error.code,
      recipients,
      from: EMAIL_FROM,
    })

    // Extract more detailed error info from SendGrid
    let sendGridErrorDetails = null
    if (error.response?.body) {
      sendGridErrorDetails = error.response.body
      console.error('[Email Debug] SendGrid response:', JSON.stringify(sendGridErrorDetails, null, 2))
    }

    throw {
      message: error.message || 'Error al enviar email',
      originalError: error.message,
      sendGridError: sendGridErrorDetails,
      debugInfo,
    }
  }
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Error response formatter for email endpoints
 */
export function formatEmailErrorResponse(error: any) {
  return {
    success: false,
    message: error.message || 'Error al enviar email',
    error: {
      type: error.sendGridError ? 'SendGrid Error' : 'Application Error',
      details: error.originalError,
      sendGridResponse: error.sendGridError,
      timestamp: new Date().toISOString(),
    },
    debug: error.debugInfo,
  }
}
