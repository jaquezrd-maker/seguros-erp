import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { useAuthStore } from '../store/authStore'

export type Module =
  | 'DASHBOARD'
  | 'CLIENTS'
  | 'POLICIES'
  | 'INSURERS'
  | 'CLAIMS'
  | 'PAYMENTS'
  | 'RENEWALS'
  | 'COMMISSIONS'
  | 'REPORTS'
  | 'USERS'
  | 'COMPANIES'
  | 'SETTINGS'
  | 'CALENDAR'
  | 'TASKS'

export type Action = 'view' | 'create' | 'edit' | 'delete'

interface ModulePermission {
  module: Module
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

interface PermissionsState {
  permissions: ModulePermission[]
  loading: boolean
  hasPermission: (module: Module, action: Action) => boolean
  canViewModule: (module: Module) => boolean
  refetch: () => void
}

export function usePermissions(): PermissionsState {
  const { user } = useAuthStore()
  const [permissions, setPermissions] = useState<ModulePermission[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPermissions = async () => {
    if (!user) {
      setPermissions([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await api.get<{ success: boolean; data: ModulePermission[] }>('/permissions/me')

      if (response.success) {
        setPermissions(response.data)
      }
    } catch (error) {
      console.error('[usePermissions] Error fetching permissions:', error)
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPermissions()
  }, [user?.id, user?.companyId])

  const hasPermission = (module: Module, action: Action): boolean => {
    // SUPER_ADMIN always has permission
    if (user?.globalRole === 'SUPER_ADMIN') {
      return true
    }

    const modulePermission = permissions.find((p) => p.module === module)
    if (!modulePermission) {
      return false
    }

    switch (action) {
      case 'view':
        return modulePermission.canView
      case 'create':
        return modulePermission.canCreate
      case 'edit':
        return modulePermission.canEdit
      case 'delete':
        return modulePermission.canDelete
      default:
        return false
    }
  }

  const canViewModule = (module: Module): boolean => {
    return hasPermission(module, 'view')
  }

  return {
    permissions,
    loading,
    hasPermission,
    canViewModule,
    refetch: fetchPermissions,
  }
}
