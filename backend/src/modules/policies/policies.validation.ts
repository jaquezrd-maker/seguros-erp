import { z } from 'zod'

const paymentMethodEnum = z.enum(['MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'])

const policyBodySchema = z.object({
  policyNumber: z.string().min(1, 'Número de póliza es requerido').max(30),
  clientId: z.number().int().positive('ID de cliente debe ser positivo'),
  insurerId: z.number().int().positive('ID de aseguradora debe ser positivo'),
  insuranceTypeId: z.number().int().positive('ID de tipo de seguro debe ser positivo'),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Fecha de inicio inválida',
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Fecha de fin inválida',
  }),
  premium: z.number().positive('La prima debe ser un valor positivo'),
  paymentMethod: paymentMethodEnum,
  numberOfInstallments: z.number().int().min(1, 'Mínimo 1 cuota').max(6, 'Máximo 6 cuotas').optional(),
  autoRenew: z.boolean().optional(),
  beneficiaryData: z.any().optional(),
  commissionRate: z.number().min(0, 'El porcentaje debe ser mayor o igual a 0').max(100, 'El porcentaje no puede ser mayor a 100').optional().nullable(),
  notes: z.string().optional(),
  paymentSchedule: z.array(z.object({
    month: z.number(),
    dueDate: z.string(),
    amount: z.number(),
    reminderDays: z.number().optional(),
  })).optional(),
})

export const createPolicySchema = z.object({
  body: policyBodySchema,
})

export const updatePolicySchema = z.object({
  body: policyBodySchema.partial(),
})

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['VIGENTE', 'VENCIDA', 'CANCELADA', 'EN_RENOVACION'], {
      required_error: 'Estado es requerido',
    }),
  }),
})
