import { useState, useEffect } from "react"
import { Check, X, Save, RefreshCw, Shield } from "lucide-react"
import { api } from "../../api/client"

type UserRole = "SUPER_ADMIN" | "ADMINISTRADOR" | "EJECUTIVO" | "CONTABILIDAD" | "SOLO_LECTURA" | "CLIENTE"

type Module =
  | "DASHBOARD"
  | "CLIENTS"
  | "POLICIES"
  | "INSURERS"
  | "CLAIMS"
  | "PAYMENTS"
  | "RENEWALS"
  | "COMMISSIONS"
  | "REPORTS"
  | "USERS"
  | "COMPANIES"
  | "SETTINGS"
  | "CALENDAR"
  | "TASKS"

interface ModulePermission {
  module: Module
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

interface RolePermissions {
  [role: string]: ModulePermission[]
}

const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMINISTRADOR: "Administrador",
  EJECUTIVO: "Ejecutivo",
  CONTABILIDAD: "Contabilidad",
  SOLO_LECTURA: "Solo Lectura",
  CLIENTE: "Cliente",
}

const moduleLabels: Record<Module, string> = {
  DASHBOARD: "Dashboard",
  CLIENTS: "Clientes",
  POLICIES: "Pólizas",
  INSURERS: "Aseguradoras",
  CLAIMS: "Siniestros",
  PAYMENTS: "Pagos",
  RENEWALS: "Renovaciones",
  COMMISSIONS: "Comisiones",
  REPORTS: "Reportes",
  USERS: "Usuarios",
  COMPANIES: "Empresas",
  SETTINGS: "Configuración",
  CALENDAR: "Calendario",
  TASKS: "Tareas",
}

const modules: Module[] = Object.keys(moduleLabels) as Module[]

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<RolePermissions>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>("ADMINISTRADOR")

  const fetchPermissions = async () => {
    try {
      setLoading(true)
      const response = await api.get<{ success: boolean; data: RolePermissions }>("/permissions")

      if (response.success) {
        setPermissions(response.data)
      }
    } catch (error) {
      console.error("Error fetching permissions:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPermissions()
  }, [])

  const handleToggle = (module: Module, field: keyof Omit<ModulePermission, "module">) => {
    setPermissions((prev) => {
      const rolePerms = prev[selectedRole] || []
      const moduleIndex = rolePerms.findIndex((p) => p.module === module)

      if (moduleIndex === -1) {
        // Module doesn't exist, create it
        return {
          ...prev,
          [selectedRole]: [
            ...rolePerms,
            {
              module,
              canView: field === "canView",
              canCreate: field === "canCreate",
              canEdit: field === "canEdit",
              canDelete: field === "canDelete",
            },
          ],
        }
      }

      // Update existing permission
      const updated = [...rolePerms]
      updated[moduleIndex] = {
        ...updated[moduleIndex],
        [field]: !updated[moduleIndex][field],
      }

      return {
        ...prev,
        [selectedRole]: updated,
      }
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const rolePerms = permissions[selectedRole] || []

      await api.put(`/permissions/${selectedRole}`, {
        permissions: rolePerms,
      })

      alert(`Permisos guardados exitosamente para ${roleLabels[selectedRole]}`)
    } catch (error: any) {
      console.error("Error saving permissions:", error)
      alert(error.response?.data?.message || "Error al guardar permisos")
    } finally {
      setSaving(false)
    }
  }

  const getPermission = (module: Module) => {
    const rolePerms = permissions[selectedRole] || []
    return rolePerms.find((p) => p.module === module) || {
      module,
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-teal-400" />
          <h1 className="text-2xl font-bold text-white">Configuración de Permisos</h1>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-700 rounded w-1/4" />
            <div className="h-64 bg-slate-700 rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-teal-400" />
          <h1 className="text-2xl font-bold text-white">Configuración de Permisos</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchPermissions}
            disabled={loading}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Recargar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || selectedRole === "SUPER_ADMIN"}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-600 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
        {/* Role Tabs */}
        <div className="border-b border-slate-700/50 px-6 pt-4">
          <div className="flex gap-2 overflow-x-auto">
            {(Object.keys(roleLabels) as UserRole[]).map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                disabled={role === "SUPER_ADMIN"}
                className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors whitespace-nowrap ${
                  selectedRole === role
                    ? "bg-teal-600 text-white"
                    : role === "SUPER_ADMIN"
                      ? "bg-slate-700/50 text-slate-500 cursor-not-allowed"
                      : "bg-slate-700/30 text-slate-400 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                {roleLabels[role]}
                {role === "SUPER_ADMIN" && " (Sin restricciones)"}
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className="p-6 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Módulo</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-300">Ver</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-300">Crear</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-300">Editar</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-300">Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((module) => {
                const perm = getPermission(module)
                return (
                  <tr key={module} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                    <td className="py-3 px-4 text-sm text-white font-medium">{moduleLabels[module]}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggle(module, "canView")}
                        className={`p-2 rounded-lg transition-colors ${
                          perm.canView
                            ? "bg-teal-600 hover:bg-teal-500"
                            : "bg-slate-700 hover:bg-slate-600"
                        }`}
                      >
                        {perm.canView ? <Check size={16} className="text-white" /> : <X size={16} className="text-slate-400" />}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggle(module, "canCreate")}
                        className={`p-2 rounded-lg transition-colors ${
                          perm.canCreate
                            ? "bg-teal-600 hover:bg-teal-500"
                            : "bg-slate-700 hover:bg-slate-600"
                        }`}
                      >
                        {perm.canCreate ? <Check size={16} className="text-white" /> : <X size={16} className="text-slate-400" />}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggle(module, "canEdit")}
                        className={`p-2 rounded-lg transition-colors ${
                          perm.canEdit
                            ? "bg-teal-600 hover:bg-teal-500"
                            : "bg-slate-700 hover:bg-slate-600"
                        }`}
                      >
                        {perm.canEdit ? <Check size={16} className="text-white" /> : <X size={16} className="text-slate-400" />}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggle(module, "canDelete")}
                        className={`p-2 rounded-lg transition-colors ${
                          perm.canDelete
                            ? "bg-teal-600 hover:bg-teal-500"
                            : "bg-slate-700 hover:bg-slate-600"
                        }`}
                      >
                        {perm.canDelete ? <Check size={16} className="text-white" /> : <X size={16} className="text-slate-400" />}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-slate-700/20 border-t border-slate-700/50">
          <p className="text-xs text-slate-400">
            <strong>Nota:</strong> Los permisos de SUPER_ADMIN no se pueden modificar. Este rol tiene acceso completo a todos los módulos.
            Los cambios se aplican inmediatamente después de guardar.
          </p>
        </div>
      </div>
    </div>
  )
}
