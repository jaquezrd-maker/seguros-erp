import { z } from 'zod'

const clientBodySchema = z.object({
  type: z.enum(['FISICA', 'JURIDICA'], {
    required_error: 'El tipo de cliente es requerido',
    invalid_type_error: 'Tipo de cliente debe ser FISICA o JURIDICA',
  }),
  name: z
    .string({ required_error: 'El nombre es requerido' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  cedulaRnc: z
    .string({ required_error: 'La cedula/RNC es requerida' })
    .min(9, 'La cedula/RNC debe tener al menos 9 caracteres')
    .max(20, 'La cedula/RNC no puede exceder 20 caracteres'),
  phone: z.string().max(20).optional().nullable(),
  phoneAlt: z.string().max(20).optional().nullable(),
  email: z.string().email('Debe ser un email válido').max(150).optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  province: z.string().max(100).optional().nullable(),
  contactPerson: z.string().max(150).optional().nullable(),
  contactPosition: z.string().max(100).optional().nullable(),
  purchasingManager: z.string().max(150).optional().nullable(),
  birthDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const createClientSchema = z.object({
  body: clientBodySchema,
})

export const updateClientSchema = z.object({
  body: clientBodySchema.partial(),
})
