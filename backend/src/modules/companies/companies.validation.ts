import { z } from 'zod'
import { CompanyStatus } from '@prisma/client'

/**
 * Validation schema for creating a new company
 */
export const createCompanySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Nombre es requerido').max(200),
    slug: z
      .string()
      .min(1, 'Slug es requerido')
      .max(100)
      .regex(/^[a-z0-9-]+$/, 'Slug debe contener solo letras minúsculas, números y guiones'),
    legalName: z.string().max(200).optional(),
    rnc: z.string().max(20).optional(),
    email: z.string().email('Email inválido').max(150).optional(),
    phone: z.string().max(20).optional(),
    address: z.string().optional(),
    logo: z.string().max(255).optional(),
    settings: z.record(z.any()).optional(),
    status: z.nativeEnum(CompanyStatus).optional(),
    trialEndsAt: z.string().datetime().optional(),
    // Optional initial admin user
    initialUser: z.object({
      name: z.string().min(1, 'Nombre del usuario es requerido').max(150),
      email: z.string().email('Email del usuario inválido').max(150),
      password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
      phone: z.string().max(20).optional(),
      role: z.enum(['ADMINISTRADOR', 'EJECUTIVO', 'CONTABILIDAD', 'SOLO_LECTURA']).default('ADMINISTRADOR'),
    }).optional(),
  }),
})

/**
 * Validation schema for updating a company
 */
export const updateCompanySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    slug: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9-]+$/, 'Slug debe contener solo letras minúsculas, números y guiones')
      .optional(),
    legalName: z.string().max(200).optional().nullable(),
    rnc: z.string().max(20).optional().nullable(),
    email: z.string().email('Email inválido').max(150).optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    address: z.string().optional().nullable(),
    logo: z.string().max(255).optional().nullable(),
    settings: z.record(z.any()).optional().nullable(),
    status: z.nativeEnum(CompanyStatus).optional(),
    trialEndsAt: z.string().datetime().optional().nullable(),
  }),
})

/**
 * Validation schema for adding a user to a company
 */
export const addUserToCompanySchema = z.object({
  body: z.object({
    userId: z.number().int().positive('ID de usuario inválido'),
    role: z.enum(['ADMINISTRADOR', 'EJECUTIVO', 'CONTABILIDAD', 'SOLO_LECTURA', 'CLIENTE']),
    isActive: z.boolean().optional(),
  }),
})

/**
 * Validation schema for updating a user's role in a company
 */
export const updateCompanyUserSchema = z.object({
  body: z.object({
    role: z.enum(['ADMINISTRADOR', 'EJECUTIVO', 'CONTABILIDAD', 'SOLO_LECTURA', 'CLIENTE']).optional(),
    isActive: z.boolean().optional(),
  }),
})

export type CreateCompanyInput = z.infer<typeof createCompanySchema>['body']
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>['body']
export type AddUserToCompanyInput = z.infer<typeof addUserToCompanySchema>['body']
export type UpdateCompanyUserInput = z.infer<typeof updateCompanyUserSchema>['body']
