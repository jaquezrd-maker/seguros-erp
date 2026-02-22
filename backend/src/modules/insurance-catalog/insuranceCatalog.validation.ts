import { z } from 'zod'

export const createPlanSchema = z.object({
  body: z.object({
    productId: z.number({ required_error: 'Producto requerido' }),
    name: z.string().min(1, 'Nombre requerido').max(200),
    tier: z.enum(['BASICO', 'INTERMEDIO', 'PREMIUM', 'FULL', 'SUPER_FULL'], {
      required_error: 'Nivel requerido',
    }),
    description: z.string().optional(),
    coverages: z.any().default([]),
    monthlyPremium: z.number().positive('Prima mensual debe ser positiva'),
    annualPremium: z.number().positive('Prima anual debe ser positiva'),
    minCoverage: z.number().positive().optional().nullable(),
    maxCoverage: z.number().positive().optional().nullable(),
    deductible: z.number().min(0).optional().nullable(),
    currency: z.string().max(3).default('DOP'),
    isPopular: z.boolean().default(false),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
  }),
})

export const updatePlanSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    tier: z.enum(['BASICO', 'INTERMEDIO', 'PREMIUM', 'FULL', 'SUPER_FULL']).optional(),
    description: z.string().optional().nullable(),
    coverages: z.any().optional(),
    monthlyPremium: z.number().positive().optional(),
    annualPremium: z.number().positive().optional(),
    minCoverage: z.number().positive().optional().nullable(),
    maxCoverage: z.number().positive().optional().nullable(),
    deductible: z.number().min(0).optional().nullable(),
    currency: z.string().max(3).optional(),
    isPopular: z.boolean().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  }),
})
