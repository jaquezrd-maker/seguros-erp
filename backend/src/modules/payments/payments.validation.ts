import { z } from 'zod'

const paymentBodySchema = z.object({
  policyId: z.number().int().positive('ID de póliza debe ser positivo'),
  clientId: z.number().int().positive('ID de cliente debe ser positivo'),
  amount: z.number().positive('El monto debe ser un valor positivo'),
  paymentMethod: z
    .string({ required_error: 'El método de pago es requerido' })
    .min(1, 'El método de pago es requerido')
    .max(50, 'El método de pago no puede exceder 50 caracteres'),
  paymentDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Fecha de pago inválida',
  }),
  dueDate: z
    .string()
    .refine((val) => {
      // Permitir vacío, null, undefined
      if (!val || val === '') return true
      // Si tiene valor, validar que sea una fecha válida
      return !isNaN(Date.parse(val))
    }, {
      message: 'Fecha de vencimiento inválida',
    })
    .optional()
    .nullable(),
  receiptNumber: z.string().max(50).optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const createPaymentSchema = z.object({
  body: paymentBodySchema,
})

export const updatePaymentSchema = z.object({
  body: paymentBodySchema.partial(),
})
