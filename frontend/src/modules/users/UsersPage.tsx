import { useState, useEffect } from "react"
import { Lock, Building2, Plus, X } from "lucide-react"
import useCrudModule from "../../hooks/useCrudModule"
import type { ERPUser } from "../../types"
import { fmtDate } from "../../utils/format"
import StatusBadge from "../../components/ui/StatusBadge"
import DataTable from "../../components/ui/DataTable"
import SearchBar from "../../components/ui/SearchBar"
import StatCard from "../../components/ui/StatCard"
import Modal from "../../components/ui/Modal"
import FormInput from "../../components/ui/FormInput"
import { api } from "../../api/client"
import { useAuth } from "../../context/AuthContext"

const defaultForm = { name: "", email: "", role: "EJECUTIVO", phone: "", password: "" }

interface UserCompany {
  companyId: number
  companyName: string
  companySlug: string
  companyStatus: string
  role: string
  isActive: boolean
  createdAt: string
}

interface Company {
  id: number
  name: string
  slug: string
  status: string
}

export default function UsersPage() {
  const { dbUser: currentUser } = useAuth()
  const crud = useCrudModule<ERPUser>({ endpoint: "/users", defaultForm })
  const [userCompanies, setUserCompanies] = useState<UserCompany[]>([])
  const [allCompanies, setAllCompanies] = useState<Company[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [showAddCompany, setShowAddCompany] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null)
  const [selectedRole, setSelectedRole] = useState("EJECUTIVO")

  // For user creation
  const [newUserCompanyId, setNewUserCompanyId] = useState<number | null>(null)
  const [newUserCompanyRole, setNewUserCompanyRole] = useState("EJECUTIVO")

  // For password reset
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [resettingPassword, setResettingPassword] = useState(false)

  const isSuperAdmin = (currentUser?.globalRole || currentUser?.role) === "SUPER_ADMIN"

  console.log('[UsersPage] currentUser:', currentUser)
  console.log('[UsersPage] isSuperAdmin:', isSuperAdmin)

  const columns = [
    { key: "name", label: "Nombre" },
    { key: "email", label: "Email" },
    { key: "role", label: "Rol Global", render: (v: string) => <StatusBadge status={v.toLowerCase()} /> },
    { key: "phone", label: "Teléfono", render: (v: string) => v || "—" },
    { key: "status", label: "Estado", render: (v: string) => <StatusBadge status={v} /> },
    { key: "lastLogin", label: "Último Acceso", render: (v: string) => v ? fmtDate(v) : "Nunca" },
  ]

  // Fetch all companies when component mounts (if SUPER_ADMIN)
  useEffect(() => {
    if (isSuperAdmin) {
      fetchAllCompanies()
    }
  }, [isSuperAdmin])

  // Fetch user's companies when viewing a user
  useEffect(() => {
    if (crud.selected && isSuperAdmin) {
      fetchUserCompanies(crud.selected.id)
    }
  }, [crud.selected, isSuperAdmin])

  const fetchAllCompanies = async () => {
    try {
      const res = await api.get<{ success: boolean; data: Company[] }>('/companies')
      setAllCompanies(res.data)
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const fetchUserCompanies = async (userId: number) => {
    try {
      setLoadingCompanies(true)
      const res = await api.get<{ success: boolean; data: UserCompany[] }>(`/users/${userId}/companies`)
      setUserCompanies(res.data)
    } catch (error) {
      console.error('Error fetching user companies:', error)
    } finally {
      setLoadingCompanies(false)
    }
  }

  const handleAddCompany = async () => {
    if (!crud.selected || !selectedCompanyId) return

    try {
      await api.post(`/users/${crud.selected.id}/companies`, {
        companyId: selectedCompanyId,
        role: selectedRole,
      })
      await fetchUserCompanies(crud.selected.id)
      setShowAddCompany(false)
      setSelectedCompanyId(null)
      setSelectedRole("EJECUTIVO")
    } catch (error: any) {
      alert(error.message || 'Error al agregar empresa')
    }
  }

  const handleUpdateRole = async (companyId: number, newRole: string) => {
    if (!crud.selected) return

    try {
      await api.patch(`/users/${crud.selected.id}/companies/${companyId}`, {
        role: newRole,
      })
      await fetchUserCompanies(crud.selected.id)
    } catch (error: any) {
      alert(error.message || 'Error al actualizar rol')
    }
  }

  const handleRemoveCompany = async (companyId: number, companyName: string) => {
    if (!crud.selected) return
    if (!confirm(`¿Remover usuario de la empresa "${companyName}"?`)) return

    try {
      await api.delete(`/users/${crud.selected.id}/companies/${companyId}`)
      await fetchUserCompanies(crud.selected.id)
    } catch (error: any) {
      alert(error.message || 'Error al remover empresa')
    }
  }

  const handleSave = async () => {
    if (crud.modal === "create") {
      // Create user first
      await crud.createItem()

      // If SUPER_ADMIN and company is selected, assign user to company
      // Note: User assignment to company can be done after creation via the view modal

      // Reset company selection
      setNewUserCompanyId(null)
      setNewUserCompanyRole("EJECUTIVO")
    } else if (crud.modal === "edit" && crud.selected) {
      await crud.updateItem(crud.selected.id)
    }
  }

  const handleToggleStatus = async (user: ERPUser) => {
    const newStatus = user.status === "ACTIVO" ? "INACTIVO" : "ACTIVO"
    await crud.patchItem(user.id, "status", { status: newStatus })
  }

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres"
    if (!/[A-Z]/.test(password)) return "Debe contener al menos una mayúscula"
    if (!/[a-z]/.test(password)) return "Debe contener al menos una minúscula"
    if (!/[0-9]/.test(password)) return "Debe contener al menos un número"
    return null
  }

  const handleResetPassword = async () => {
    if (!crud.selected) return

    setPasswordError("")

    // Validar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden")
      return
    }

    // Validar requisitos de contraseña
    const validationError = validatePassword(newPassword)
    if (validationError) {
      setPasswordError(validationError)
      return
    }

    try {
      setResettingPassword(true)
      await api.patch(`/users/${crud.selected.id}/password`, { password: newPassword })

      setShowResetPassword(false)
      setNewPassword("")
      setConfirmPassword("")
      alert(`Contraseña actualizada exitosamente para ${crud.selected.name}`)
    } catch (error: any) {
      setPasswordError(error.message || "Error al resetear contraseña")
    } finally {
      setResettingPassword(false)
    }
  }

  const availableCompanies = allCompanies.filter(
    company => !userCompanies.some(uc => uc.companyId === company.id)
  )

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Usuarios" value={crud.total} icon={Lock} color="teal" />
        <StatCard title="Activos" value={crud.items.filter(u => u.status === "ACTIVO").length} icon={Lock} color="emerald" />
        <StatCard title="Inactivos" value={crud.items.filter(u => u.status !== "ACTIVO").length} icon={Lock} color="red" />
      </div>

      <SearchBar value={crud.search} onChange={crud.setSearch} placeholder="Buscar usuario..." onAdd={crud.openNew} addLabel="Nuevo Usuario" />

      {crud.success && <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl p-3 mb-4 text-sm">{crud.success}</div>}
      {crud.error && <div className="bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl p-3 mb-4 text-sm">{crud.error}</div>}

      <DataTable columns={columns} data={crud.items} loading={crud.loading}
        onView={crud.openView} onEdit={crud.openEdit} onDelete={crud.askDelete} />

      <Modal isOpen={crud.modal === "view"} onClose={crud.closeModal} title="Detalle del Usuario" size="lg">
        {crud.selected && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-400">Nombre:</span> <span className="text-white ml-2">{crud.selected.name}</span></div>
              <div><span className="text-slate-400">Email:</span> <span className="text-white ml-2">{crud.selected.email}</span></div>
              <div><span className="text-slate-400">Rol Global:</span> <span className="text-white ml-2">{crud.selected.role}</span></div>
              <div><span className="text-slate-400">Estado:</span> <span className="ml-2"><StatusBadge status={crud.selected.status} /></span></div>
              <div><span className="text-slate-400">Teléfono:</span> <span className="text-white ml-2">{crud.selected.phone || "—"}</span></div>
              <div><span className="text-slate-400">Último Acceso:</span> <span className="text-white ml-2">{crud.selected.lastLogin ? fmtDate(crud.selected.lastLogin) : "Nunca"}</span></div>
            </div>

            {isSuperAdmin && (
              <div className="border-t border-slate-700 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Empresas del Usuario
                  </h3>
                  <button
                    onClick={() => setShowAddCompany(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-sm rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Empresa
                  </button>
                </div>

                {loadingCompanies ? (
                  <div className="text-center py-8 text-slate-400">Cargando empresas...</div>
                ) : userCompanies.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 bg-slate-800/50 rounded-lg">
                    El usuario no pertenece a ninguna empresa
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userCompanies.map(uc => (
                      <div key={uc.companyId} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span className="font-medium text-white">{uc.companyName}</span>
                            <StatusBadge status={uc.companyStatus} />
                          </div>
                          <div className="text-xs text-slate-400 ml-6">
                            Slug: {uc.companySlug} · Agregado: {fmtDate(uc.createdAt)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={uc.role}
                            onChange={(e) => handleUpdateRole(uc.companyId, e.target.value)}
                            className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="ADMINISTRADOR">Administrador</option>
                            <option value="EJECUTIVO">Ejecutivo</option>
                            <option value="CONTABILIDAD">Contabilidad</option>
                            <option value="SOLO_LECTURA">Solo Lectura</option>
                          </select>
                          <button
                            onClick={() => handleRemoveCompany(uc.companyId, uc.companyName)}
                            className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Remover de empresa"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showAddCompany && (
                  <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <h4 className="text-sm font-medium text-white mb-3">Agregar a Empresa</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Empresa</label>
                        <select
                          value={selectedCompanyId || ''}
                          onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-700 text-white text-sm rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="">Seleccionar empresa...</option>
                          {availableCompanies.map(company => (
                            <option key={company.id} value={company.id}>
                              {company.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Rol en la Empresa</label>
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-700 text-white text-sm rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="ADMINISTRADOR">Administrador</option>
                          <option value="EJECUTIVO">Ejecutivo</option>
                          <option value="CONTABILIDAD">Contabilidad</option>
                          <option value="SOLO_LECTURA">Solo Lectura</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        onClick={() => {
                          setShowAddCompany(false)
                          setSelectedCompanyId(null)
                        }}
                        className="px-3 py-1.5 text-slate-300 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleAddCompany}
                        disabled={!selectedCompanyId}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-slate-700 flex gap-3">
              <button onClick={() => handleToggleStatus(crud.selected!)}
                className={`px-4 py-2 rounded-xl text-white text-sm transition-colors ${crud.selected.status === "ACTIVO" ? "bg-red-600 hover:bg-red-500" : "bg-emerald-600 hover:bg-emerald-500"}`}>
                {crud.selected.status === "ACTIVO" ? "Desactivar" : "Activar"}
              </button>
              <button
                onClick={() => setShowResetPassword(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-xl transition-colors"
              >
                <Lock className="w-4 h-4" />
                Resetear Contraseña
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={crud.modal === "create" || crud.modal === "edit"} onClose={crud.closeModal}
        title={crud.modal === "create" ? "Nuevo Usuario" : "Editar Usuario"} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Nombre" value={crud.form.name} onChange={v => crud.updateField("name", v)} required />
            <FormInput label="Email" type="email" value={crud.form.email} onChange={v => crud.updateField("email", v)} required />
            {crud.modal === "create" && (
              <div className="md:col-span-2">
                <FormInput
                  label="Contraseña"
                  type="password"
                  value={crud.form.password}
                  onChange={v => crud.updateField("password", v)}
                  required
                  placeholder="Mínimo 8 caracteres, incluir mayúsculas, minúsculas y números"
                />
              </div>
            )}
            <FormInput label="Rol Global" type="select" value={crud.form.role} onChange={v => crud.updateField("role", v)} required
              options={[
                ...(isSuperAdmin ? [{ value: "SUPER_ADMIN", label: "Super Administrador" }] : []),
                { value: "ADMINISTRADOR", label: "Administrador" },
                { value: "EJECUTIVO", label: "Ejecutivo de Seguros" },
                { value: "CONTABILIDAD", label: "Contabilidad" },
                { value: "SOLO_LECTURA", label: "Solo Lectura" },
              ]} />
            <FormInput label="Teléfono" value={crud.form.phone} onChange={v => crud.updateField("phone", v)} />
          </div>

          {/* Company assignment - only for SUPER_ADMIN when creating */}
          {isSuperAdmin && crud.modal === "create" && (
            <div className="border-t border-slate-700 pt-4">
              <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Asignar a Empresa (Opcional)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Empresa</label>
                  <select
                    value={newUserCompanyId || ''}
                    onChange={(e) => setNewUserCompanyId(Number(e.target.value) || null)}
                    className="w-full px-3 py-2 bg-slate-700 text-white text-sm rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Sin asignar</option>
                    {allCompanies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Puedes asignar más empresas después</p>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Rol en la Empresa</label>
                  <select
                    value={newUserCompanyRole}
                    onChange={(e) => setNewUserCompanyRole(e.target.value)}
                    disabled={!newUserCompanyId}
                    className="w-full px-3 py-2 bg-slate-700 text-white text-sm rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                  >
                    <option value="ADMINISTRADOR">Administrador</option>
                    <option value="EJECUTIVO">Ejecutivo</option>
                    <option value="CONTABILIDAD">Contabilidad</option>
                    <option value="SOLO_LECTURA">Solo Lectura</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
        {crud.error && <div className="bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl p-3 mt-4 text-sm">{crud.error}</div>}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={crud.closeModal} className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={crud.saving}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {crud.saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </Modal>

      <Modal isOpen={!!crud.deleteTarget} onClose={crud.cancelDelete} title="Eliminar Usuario" size="md">
        {crud.deleteTarget && (
          <div className="space-y-4">
            <p className="text-slate-300 text-sm">
              ¿Qué desea hacer con el usuario <span className="font-semibold text-white">{crud.deleteTarget.name}</span>?
            </p>

            <div className="space-y-3">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <h4 className="text-amber-400 font-semibold mb-2 text-sm">Desactivar Usuario (Recomendado)</h4>
                <p className="text-slate-400 text-xs mb-3">
                  El usuario se marcará como INACTIVO pero se mantendrá en el sistema con todo su historial.
                </p>
                <button
                  onClick={() => crud.deleteItem(false)}
                  disabled={crud.saving}
                  className="w-full px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {crud.saving ? "Procesando..." : "Desactivar Usuario"}
                </button>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <h4 className="text-red-400 font-semibold mb-2 text-sm flex items-center gap-2">
                  <span>⚠️</span> Eliminar Permanentemente
                </h4>
                <p className="text-slate-400 text-xs mb-3">
                  El usuario se eliminará completamente de la base de datos. Esta acción NO se puede deshacer.
                  Solo funciona si el usuario no tiene datos relacionados (clientes, pólizas, pagos, reclamos, comisiones).
                </p>
                <button
                  onClick={() => crud.deleteItem(true)}
                  disabled={crud.saving}
                  className="w-full px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {crud.saving ? "Procesando..." : "Eliminar Permanentemente"}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={crud.cancelDelete}
                disabled={crud.saving}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal para Resetear Contraseña */}
      <Modal
        isOpen={showResetPassword}
        onClose={() => {
          setShowResetPassword(false)
          setNewPassword("")
          setConfirmPassword("")
          setPasswordError("")
        }}
        title="Resetear Contraseña"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <p className="text-slate-300 text-sm">
              Resetear contraseña para: <span className="font-semibold text-white">{crud.selected?.name}</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {crud.selected?.email}
            </p>
          </div>

          <div className="space-y-3">
            <FormInput
              label="Nueva Contraseña"
              type="password"
              value={newPassword}
              onChange={setNewPassword}
              required
              placeholder="Mínimo 8 caracteres"
            />
            <FormInput
              label="Confirmar Contraseña"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              required
              placeholder="Confirmar contraseña"
            />
          </div>

          <div className="bg-slate-800/50 rounded-lg p-3 text-xs text-slate-400">
            <p className="font-semibold text-white mb-2">Requisitos de contraseña:</p>
            <ul className="list-disc list-inside space-y-1">
              <li className={newPassword.length >= 8 ? "text-emerald-400" : ""}>
                Mínimo 8 caracteres
              </li>
              <li className={/[A-Z]/.test(newPassword) ? "text-emerald-400" : ""}>
                Al menos una mayúscula
              </li>
              <li className={/[a-z]/.test(newPassword) ? "text-emerald-400" : ""}>
                Al menos una minúscula
              </li>
              <li className={/[0-9]/.test(newPassword) ? "text-emerald-400" : ""}>
                Al menos un número
              </li>
            </ul>
          </div>

          {passwordError && (
            <div className="bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl p-3 text-sm">
              {passwordError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setShowResetPassword(false)
                setNewPassword("")
                setConfirmPassword("")
                setPasswordError("")
              }}
              disabled={resettingPassword}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleResetPassword}
              disabled={resettingPassword || !newPassword || !confirmPassword}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              {resettingPassword ? "Reseteando..." : "Resetear Contraseña"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
