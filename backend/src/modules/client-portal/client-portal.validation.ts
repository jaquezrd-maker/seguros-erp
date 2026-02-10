import { z } from 'zod'

// Validación de token
export const validateInvitationSchema = z.object({
  params: z.object({
    token: z.string().min(1, 'Token es requerido')
  })
})

// Validación de registro
export const completeRegistrationSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token es requerido'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
      .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
    confirmPassword: z.string().min(1, 'Confirmación de contraseña es requerida')
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword']
  })
})

// Validación de cambio de contraseña
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Contraseña actual es requerida'),
    newPassword: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
      .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
    confirmNewPassword: z.string().min(1, 'Confirmación de contraseña es requerida')
  }).refine(data => data.newPassword === data.confirmNewPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmNewPassword']
  }).refine(data => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['newPassword']
  })
})

export type ValidateInvitationInput = z.infer<typeof validateInvitationSchema>
export type CompleteRegistrationInput = z.infer<typeof completeRegistrationSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
