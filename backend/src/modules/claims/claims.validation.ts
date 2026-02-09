import { z } from 'zod'

const claimBodySchema = z.object({
  policyId: z
    .number({ required_error: 'El ID de la poliza es requerido' })
    .int('El ID de la poliza debe ser un entero')
    .positive('El ID de la poliza debe ser positivo'),
  type: z
    .string({ required_error: 'El tipo de siniestro es requerido' })
    .min(1, 'El tipo de siniestro es requerido')
    .max(100, 'El tipo no puede exceder 100 caracteres'),
  dateOccurred: z
    .string({ required_error: 'La fecha del siniestro es requerida' })
    .min(1, 'La fecha del siniestro es requerida'),
  description: z.string().optional().nullable(),
  estimatedAmount: z
    .number()
    .positive('El monto estimado debe ser positivo')
    .optional()
    .nullable(),
  priority: z
    .enum(['BAJA', 'MEDIA', 'ALTA', 'CRITICA'], {
      invalid_type_error: 'Prioridad debe ser BAJA, MEDIA, ALTA o CRITICA',
    })
    .optional(),
})

export const createClaimSchema = z.object({
  body: claimBodySchema,
})

export const updateClaimSchema = z.object({
  body: claimBodySchema.partial(),
})

export const addNoteSchema = z.object({
  body: z.object({
    note: z
      .string({ required_error: 'La nota es requerida' })
      .min(1, 'La nota no puede estar vacia'),
    isInternal: z.boolean().default(true).optional(),
  }),
})

export const sendEmailSchema = z.object({
  body: z.object({
    recipients: z.array(z.enum(['client', 'insurer', 'internal', 'all'])).min(1, 'Al menos un destinatario es requerido'),
    includeAttachment: z.boolean().default(false),
  }),
})
