import { z } from 'zod'

const userBodySchema = z.object({
  name: z
    .string({ required_error: 'El nombre es requerido' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(150, 'El nombre no puede exceder 150 caracteres'),
  email: z
    .string({ required_error: 'El email es requerido' })
    .email('Debe ser un email válido')
    .max(150, 'El email no puede exceder 150 caracteres'),
  role: z.enum(['ADMINISTRADOR', 'EJECUTIVO', 'CONTABILIDAD', 'SOLO_LECTURA'], {
    required_error: 'El rol es requerido',
    invalid_type_error: 'Rol debe ser ADMINISTRADOR, EJECUTIVO, CONTABILIDAD o SOLO_LECTURA',
  }),
  phone: z.string().max(20).optional().nullable(),
})

export const createUserSchema = z.object({
  body: userBodySchema.extend({
    password: z
      .string({ required_error: 'La contraseña es requerida' })
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(100, 'La contraseña no puede exceder 100 caracteres')
      .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
      .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
  }),
})

export const updateUserSchema = z.object({
  body: userBodySchema.partial(),
})

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ACTIVO', 'INACTIVO', 'BLOQUEADO'], {
      required_error: 'El estado es requerido',
      invalid_type_error: 'Estado debe ser ACTIVO, INACTIVO o BLOQUEADO',
    }),
  }),
})
