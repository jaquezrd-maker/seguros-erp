import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@seguropro.com'

export async function sendEmail(options: {
  to: string
  subject: string
  html: string
}) {
  if (!process.env.SMTP_PASS) {
    console.log('[Email] SMTP not configured, skipping email:', options.subject)
    return
  }
  return transporter.sendMail({
    from: EMAIL_FROM,
    ...options,
  })
}
