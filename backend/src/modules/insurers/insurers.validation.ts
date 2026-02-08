import { z } from 'zod'

export const createInsurerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'El nombre es requerido' })
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(200, 'El nombre no puede exceder 200 caracteres'),
    rnc: z
      .string({ required_error: 'El RNC es requerido' })
      .min(9, 'El RNC debe tener al menos 9 caracteres')
      .max(20, 'El RNC no puede exceder 20 caracteres'),
    legalName: z
      .string()
      .max(200, 'El nombre legal no puede exceder 200 caracteres')
      .optional(),
    phone: z
      .string()
      .max(20, 'El teléfono no puede exceder 20 caracteres')
      .optional(),
    email: z
      .string()
      .email('El correo electrónico no es válido')
      .max(150, 'El correo no puede exceder 150 caracteres')
      .optional(),
    contactPerson: z
      .string()
      .max(150, 'El contacto no puede exceder 150 caracteres')
      .optional(),
    address: z.string().optional(),
  }),
})

export const updateInsurerSchema = z.object({
  body: createInsurerSchema.shape.body.partial(),
})
