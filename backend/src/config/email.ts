import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: parseInt(process.env.SMTP_PORT || '587') === 465, // Use SSL for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

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
    console.log('[Email] SMTP not configured, skipping email:', options.subject)
    return
  }

  // Convert single recipient to array for consistency
  const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to

  return transporter.sendMail({
    from: EMAIL_FROM,
    to: recipients,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments,
  })
}
