import { z } from 'zod'

const commissionBodySchema = z.object({
  policyId: z.number().int().positive('ID de póliza debe ser positivo'),
  producerId: z.number().int().positive('ID de productor debe ser positivo'),
  premiumAmount: z.number().positive('El monto de prima debe ser positivo'),
  rate: z.number().min(0, 'La tasa no puede ser negativa').max(100, 'La tasa no puede exceder 100'),
  amount: z.number().positive('El monto de comisión debe ser positivo'),
  period: z
    .string({ required_error: 'El periodo es requerido' })
    .min(1, 'El periodo es requerido')
    .max(20, 'El periodo no puede exceder 20 caracteres'),
})

export const createCommissionSchema = z.object({
  body: commissionBodySchema,
})
