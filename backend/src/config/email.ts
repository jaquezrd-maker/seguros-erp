import sgMail from '@sendgrid/mail'

// Initialize SendGrid with API key
if (process.env.SMTP_PASS) {
  sgMail.setApiKey(process.env.SMTP_PASS)
}

export const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@seguropro.com'

export interface EmailAttachment {
  filename: string
  content: Buffer | string
  contentType?: string
}

export async function sendEmail(options: {
  to: string | string[]
  subject: string
  html: string
  attachments?: EmailAttachment[]
}) {
  if (!process.env.SMTP_PASS) {
    console.log('[Email] SendGrid not configured, skipping email:', options.subject)
    return
  }

  // Convert single recipient to array for consistency
  const recipients = Array.isArray(options.to) ? options.to : [options.to]

  // Convert attachments to SendGrid format
  const sendGridAttachments = options.attachments?.map((att) => ({
    filename: att.filename,
    content: Buffer.isBuffer(att.content)
      ? att.content.toString('base64')
      : Buffer.from(att.content).toString('base64'),
    type: att.contentType || 'application/octet-stream',
    disposition: 'attachment',
  }))

  const msg = {
    to: recipients,
    from: EMAIL_FROM,
    subject: options.subject,
    html: options.html,
    attachments: sendGridAttachments,
  }

  try {
    console.log('[Email] Attempting to send:', {
      from: EMAIL_FROM,
      to: recipients,
      subject: options.subject,
      hasAttachments: !!options.attachments?.length,
    })

    const response = await sgMail.send(msg)
    console.log('[Email] Sent successfully:', options.subject, 'to', recipients.join(', '))
    return response
  } catch (error: any) {
    console.error('[Email] Failed to send:', error.message)
    console.error('[Email] Recipients were:', recipients)
    console.error('[Email] From was:', EMAIL_FROM)
    if (error.response) {
      console.error('[Email] SendGrid error details:', JSON.stringify(error.response.body, null, 2))
    }
    throw new Error(`SendGrid error: ${error.message}`)
  }
}
