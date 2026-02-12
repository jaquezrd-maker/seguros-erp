import { z } from 'zod'
import { UserRole, Module } from '@prisma/client'

const permissionSchema = z.object({
  module: z.nativeEnum(Module),
  canView: z.boolean(),
  canCreate: z.boolean(),
  canEdit: z.boolean(),
  canDelete: z.boolean(),
})

export const updatePermissionsSchema = z.object({
  body: z.object({
    permissions: z.array(permissionSchema).min(1),
  }),
})

export const roleParamSchema = z.object({
  params: z.object({
    role: z.nativeEnum(UserRole),
  }),
})
