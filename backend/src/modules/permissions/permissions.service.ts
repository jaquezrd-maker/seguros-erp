import prisma from '../../config/database'
import { UserRole, Module } from '@prisma/client'

interface UpdatePermissionsInput {
  role: UserRole
  permissions: {
    module: Module
    canView: boolean
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
  }[]
}

export class PermissionsService {
  /**
   * Get all permissions grouped by role
   */
  async getAllPermissions() {
    const permissions = await prisma.modulePermission.findMany({
      orderBy: [{ role: 'asc' }, { module: 'asc' }],
    })

    // Group by role
    const grouped = permissions.reduce(
      (acc, perm) => {
        if (!acc[perm.role]) {
          acc[perm.role] = []
        }
        acc[perm.role].push({
          module: perm.module,
          canView: perm.canView,
          canCreate: perm.canCreate,
          canEdit: perm.canEdit,
          canDelete: perm.canDelete,
        })
        return acc
      },
      {} as Record<
        UserRole,
        Array<{
          module: Module
          canView: boolean
          canCreate: boolean
          canEdit: boolean
          canDelete: boolean
        }>
      >
    )

    return grouped
  }

  /**
   * Get permissions for a specific role
   */
  async getPermissionsByRole(role: UserRole) {
    const permissions = await prisma.modulePermission.findMany({
      where: { role },
      orderBy: { module: 'asc' },
    })

    return permissions.map((p) => ({
      module: p.module,
      canView: p.canView,
      canCreate: p.canCreate,
      canEdit: p.canEdit,
      canDelete: p.canDelete,
    }))
  }

  /**
   * Check if a role has permission for a module
   */
  async hasPermission(
    role: UserRole,
    module: Module,
    action: 'view' | 'create' | 'edit' | 'delete'
  ): Promise<boolean> {
    // SUPER_ADMIN always has access
    if (role === 'SUPER_ADMIN') {
      return true
    }

    const permission = await prisma.modulePermission.findUnique({
      where: {
        role_module: { role, module },
      },
    })

    if (!permission) {
      return false
    }

    switch (action) {
      case 'view':
        return permission.canView
      case 'create':
        return permission.canCreate
      case 'edit':
        return permission.canEdit
      case 'delete':
        return permission.canDelete
      default:
        return false
    }
  }

  /**
   * Update permissions for a role
   * Only SUPER_ADMIN can update permissions
   */
  async updateRolePermissions(input: UpdatePermissionsInput) {
    const { role, permissions } = input

    // Update each permission
    const updates = permissions.map((perm) =>
      prisma.modulePermission.upsert({
        where: {
          role_module: { role, module: perm.module },
        },
        update: {
          canView: perm.canView,
          canCreate: perm.canCreate,
          canEdit: perm.canEdit,
          canDelete: perm.canDelete,
        },
        create: {
          role,
          module: perm.module,
          canView: perm.canView,
          canCreate: perm.canCreate,
          canEdit: perm.canEdit,
          canDelete: perm.canDelete,
        },
      })
    )

    await Promise.all(updates)

    return {
      success: true,
      message: `Permisos actualizados para rol ${role}`,
    }
  }

  /**
   * Get user's permissions based on their role
   * Takes into account company-specific role if applicable
   */
  async getUserPermissions(userId: number, companyId?: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        companies: {
          where: companyId ? { companyId } : {},
          include: { company: true },
        },
      },
    })

    if (!user) {
      throw new Error('Usuario no encontrado')
    }

    // Determine effective role
    let effectiveRole: UserRole = user.role

    // If user has company-specific role, use that
    if (companyId) {
      const companyRole = user.companies.find((cu) => cu.companyId === companyId)
      if (companyRole) {
        effectiveRole = companyRole.role
      }
    }

    // Get permissions for effective role
    return this.getPermissionsByRole(effectiveRole)
  }
}

export default new PermissionsService()
