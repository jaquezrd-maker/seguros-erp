import { z } from 'zod'

export const createEventSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: 'El título es requerido' })
      .min(1, 'El título es requerido')
      .max(200, 'El título no puede exceder 200 caracteres'),
    description: z.string().max(1000, 'La descripción no puede exceder 1000 caracteres').optional(),
    startDate: z.string({ required_error: 'La fecha de inicio es requerida' }),
    endDate: z.string().optional(),
    allDay: z.boolean().optional(),
    type: z.enum(['REMINDER', 'MEETING', 'FOLLOW_UP', 'POLICY_EXPIRATION', 'PAYMENT_DUE', 'RENEWAL_DUE', 'OTHER'], {
      required_error: 'El tipo de evento es requerido',
    }),
    color: z.string().max(20).optional(),
    policyId: z.number().int().positive().optional(),
    clientId: z.number().int().positive().optional(),
  }),
})

export const updateEventSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    allDay: z.boolean().optional(),
    type: z.enum(['REMINDER', 'MEETING', 'FOLLOW_UP', 'POLICY_EXPIRATION', 'PAYMENT_DUE', 'RENEWAL_DUE', 'OTHER']).optional(),
    color: z.string().max(20).optional(),
    policyId: z.number().int().positive().optional(),
    clientId: z.number().int().positive().optional(),
  }),
})
