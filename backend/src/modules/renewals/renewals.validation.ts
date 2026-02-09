import { z } from 'zod'

export const processRenewalSchema = z.object({
  body: z.object({
    newEndDate: z.string({ required_error: 'La nueva fecha de fin es requerida' }).refine(
      (val) => !isNaN(Date.parse(val)),
      { message: 'Fecha de fin inválida' }
    ),
    newPremium: z.number().positive('La nueva prima debe ser un valor positivo').optional().nullable(),
  }),
})

export const sendEmailSchema = z.object({
  body: z.object({
    recipients: z.array(z.enum(['client', 'insurer', 'internal', 'all'])).min(1, 'Al menos un destinatario es requerido'),
    includeAttachment: z.boolean().default(false),
  }),
})
