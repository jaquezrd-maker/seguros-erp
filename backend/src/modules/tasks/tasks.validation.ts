import { z } from 'zod'

const taskBodySchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200),
  description: z.string().optional().nullable(),
  completed: z.boolean().optional(),
  priority: z.enum(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']).optional(),
  dueDate: z.string().optional().nullable(),
})

export const createTaskSchema = z.object({
  body: taskBodySchema,
})

export const updateTaskSchema = z.object({
  body: taskBodySchema.partial(),
})
