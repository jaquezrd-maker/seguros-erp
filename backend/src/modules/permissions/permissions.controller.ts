import { Request, Response } from 'express'
import permissionsService from './permissions.service'
import { UserRole } from '@prisma/client'

export class PermissionsController {
  /**
   * Get all permissions grouped by role
   * GET /permissions
   */
  async getAllPermissions(req: Request, res: Response) {
    try {
      const permissions = await permissionsService.getAllPermissions()

      return res.status(200).json({
        success: true,
        data: permissions,
      })
    } catch (error: any) {
      console.error('[PERMISSIONS] Error fetching all permissions:', error)
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener permisos',
      })
    }
  }

  /**
   * Get permissions for a specific role
   * GET /permissions/:role
   */
  async getPermissionsByRole(req: Request, res: Response) {
    try {
      const role = req.params.role as UserRole

      const permissions = await permissionsService.getPermissionsByRole(role)

      return res.status(200).json({
        success: true,
        data: permissions,
      })
    } catch (error: any) {
      console.error('[PERMISSIONS] Error fetching role permissions:', error)
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener permisos del rol',
      })
    }
  }

  /**
   * Update permissions for a role
   * PUT /permissions/:role
   */
  async updateRolePermissions(req: Request, res: Response) {
    try {
      const role = req.params.role as UserRole
      const { permissions } = req.body

      const result = await permissionsService.updateRolePermissions({
        role,
        permissions,
      })

      return res.status(200).json({
        success: true,
        data: result,
        message: `Permisos actualizados para ${role}`,
      })
    } catch (error: any) {
      console.error('[PERMISSIONS] Error updating permissions:', error)
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar permisos',
      })
    }
  }

  /**
   * Get current user's permissions
   * GET /permissions/me
   */
  async getMyPermissions(req: Request, res: Response) {
    try {
      const userId = req.user!.id
      const companyId = req.user!.companyId

      const permissions = await permissionsService.getUserPermissions(userId, companyId)

      return res.status(200).json({
        success: true,
        data: permissions,
      })
    } catch (error: any) {
      console.error('[PERMISSIONS] Error fetching user permissions:', error)
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener permisos de usuario',
      })
    }
  }
}

export default new PermissionsController()
