import { z } from 'zod'

// Validación para obtener pólizas con filtros
export const getPoliciesSchema = z.object({
  query: z.object({
    status: z.enum(['VIGENTE', 'VENCIDA', 'CANCELADA', 'EN_RENOVACION']).optional(),
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 50)
  })
})

// Validación para obtener detalle de póliza
export const getPolicyDetailSchema = z.object({
  params: z.object({
    id: z.string().transform(val => parseInt(val, 10))
  })
})

// Validación para crear reclamo
export const createClaimSchema = z.object({
  body: z.object({
    policyId: z.number({
      required_error: 'ID de póliza es requerido',
      invalid_type_error: 'ID de póliza debe ser un número'
    }),
    type: z.string().min(1, 'Tipo de siniestro es requerido').max(100),
    dateOccurred: z.string().refine(val => !isNaN(Date.parse(val)), {
      message: 'Fecha del incidente inválida'
    }),
    description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres').max(2000),
    estimatedAmount: z.number().positive().optional()
  })
})

export type GetPoliciesInput = z.infer<typeof getPoliciesSchema>
export type GetPolicyDetailInput = z.infer<typeof getPolicyDetailSchema>
export type CreateClaimInput = z.infer<typeof createClaimSchema>
