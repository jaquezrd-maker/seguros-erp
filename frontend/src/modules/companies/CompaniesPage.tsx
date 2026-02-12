import { useState, useEffect } from 'react'
import { Plus, Building2, Users, Trash2, UserPlus } from 'lucide-react'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import FormInput from '../../components/ui/FormInput'
import StatusBadge from '../../components/ui/StatusBadge'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

interface Company {
  id: number
  name: string
  slug: string
  legalName: string | null
  rnc: string | null
  email: string | null
  phone: string | null
  status: 'ACTIVO' | 'SUSPENDIDO' | 'TRIAL' | 'CANCELADO'
  _count?: {
    companyUsers: number
    clients: number
    policies: number
  }
  createdAt: string
}

interface CompanyUser {
  userId: number
  companyId: number
  role: string
  isActive: boolean
  user: {
    id: number
    name: string
    email: string
    status: string
  }
}

interface User {
  id: number
  name: string
  email: string
  role: string
  status: string
}

const defaultFormData = {
  name: '',
  slug: '',
  legalName: '',
  rnc: '',
  email: '',
  phone: '',
  status: 'ACTIVO' as 'ACTIVO' | 'SUSPENDIDO' | 'TRIAL' | 'CANCELADO',
  initialUser: {
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'ADMINISTRADOR' as 'ADMINISTRADOR' | 'EJECUTIVO' | 'CONTABILIDAD' | 'SOLO_LECTURA',
  },
}

export default function CompaniesPage() {
  const { refreshDbUser } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null)
  const [formData, setFormData] = useState(defaultFormData)
  const [createUser, setCreateUser] = useState(false)

  // User management states
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [showAddUser, setShowAddUser] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedRole, setSelectedRole] = useState('EJECUTIVO')

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const res = await api.get<{ success: boolean; data: Company[] }>('/companies')
      setCompanies(res.data)
    } catch (error) {
      console.error('[CompaniesPage] Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanyUsers = async (companyId: number) => {
    try {
      setLoadingUsers(true)
      const res = await api.get<{ success: boolean; data: any }>(`/companies/${companyId}`)
      setCompanyUsers(res.data.companyUsers || [])
    } catch (error) {
      console.error('[CompaniesPage] Error fetching company users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchAllUsers = async () => {
    try {
      const res = await api.get<{ success: boolean; data: User[] }>('/users')
      setAllUsers(res.data)
    } catch (error) {
      console.error('[CompaniesPage] Error fetching users:', error)
    }
  }

  const handleView = async (company: Company) => {
    setViewingCompany(company)
    setShowViewModal(true)
    await fetchCompanyUsers(company.id)
    await fetchAllUsers()
  }

  const handleAddUser = async () => {
    if (!viewingCompany || !selectedUserId) return

    try {
      await api.post(`/companies/${viewingCompany.id}/users`, {
        userId: selectedUserId,
        role: selectedRole,
      })
      await fetchCompanyUsers(viewingCompany.id)
      setShowAddUser(false)
      setSelectedUserId(null)
      setSelectedRole('EJECUTIVO')
      await fetchCompanies() // Refresh to update counts
      await refreshDbUser() // Refresh user data if affected
    } catch (error: any) {
      alert(error.message || 'Error al agregar usuario')
    }
  }

  const handleUpdateUserRole = async (userId: number, newRole: string) => {
    if (!viewingCompany) return

    try {
      await api.patch(`/companies/${viewingCompany.id}/users/${userId}`, {
        role: newRole,
      })
      await fetchCompanyUsers(viewingCompany.id)
    } catch (error: any) {
      alert(error.message || 'Error al actualizar rol')
    }
  }

  const handleRemoveUser = async (userId: number) => {
    if (!viewingCompany) return
    if (!confirm('¿Remover este usuario de la empresa?')) return

    try {
      await api.delete(`/companies/${viewingCompany.id}/users/${userId}`)
      await fetchCompanyUsers(viewingCompany.id)
      await fetchCompanies() // Refresh to update counts
      await refreshDbUser() // Refresh user data if affected
    } catch (error: any) {
      alert(error.message || 'Error al remover usuario')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Prepare data - exclude initialUser if not creating one
      const submitData = { ...formData }
      if (!createUser || editingCompany) {
        delete (submitData as any).initialUser
      } else if (createUser) {
        // Validate user fields if creating user
        if (!submitData.initialUser.name || !submitData.initialUser.email || !submitData.initialUser.password) {
          alert('Por favor completa todos los campos del usuario')
          return
        }
      }

      if (editingCompany) {
        await api.put(`/companies/${editingCompany.id}`, submitData)
      } else {
        await api.post('/companies', submitData)
      }
      setShowModal(false)
      setFormData(defaultFormData)
      setEditingCompany(null)
      setCreateUser(false)
      await fetchCompanies()
      await refreshDbUser() // Refresh user data to sync company access
    } catch (error: any) {
      alert(error.message || 'Error al guardar')
    }
  }

  const handleEdit = (company: Company) => {
    setFormData({
      name: company.name,
      slug: company.slug,
      legalName: company.legalName || '',
      rnc: company.rnc || '',
      email: company.email || '',
      phone: company.phone || '',
      status: company.status,
      initialUser: defaultFormData.initialUser, // Reset user fields
    })
    setEditingCompany(company)
    setCreateUser(false) // Reset create user flag
    setShowModal(true)
  }

  const handleDelete = async (company: Company) => {
    if (!confirm(`¿Eliminar empresa "${company.name}"?`)) return
    try {
      await api.delete(`/companies/${company.id}`)
      await fetchCompanies()
      await refreshDbUser() // Refresh user data to sync company list
    } catch (error: any) {
      alert(error.message || 'Error al eliminar')
    }
  }

  const availableUsers = allUsers.filter(
    (user) => !companyUsers.some((cu) => cu.userId === user.id)
  )

  const columns = [
    {
      key: 'name',
      label: 'Nombre',
      render: (_value: any, company: Company) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <div>
            <div className="font-medium text-white">{company.name}</div>
            <div className="text-xs text-slate-500">{company.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'legalName',
      label: 'Razón Social',
      render: (_value: any, company: Company) => (
        <span className="text-sm text-slate-300">
          {company.legalName || '-'}
        </span>
      ),
    },
    {
      key: 'rnc',
      label: 'RNC',
      render: (_value: any, company: Company) => (
        <span className="text-sm text-slate-300">
          {company.rnc || '-'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (_value: any, company: Company) => <StatusBadge status={company.status} />,
    },
    {
      key: '_count',
      label: 'Estadísticas',
      render: (_value: any, company: Company) => (
        <div className="text-sm text-slate-300">
          <div>{company._count?.companyUsers || 0} usuarios</div>
          <div className="text-xs text-slate-500">
            {company._count?.clients || 0} clientes · {company._count?.policies || 0} pólizas
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Empresas</h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestión de empresas corredoras en la plataforma
          </p>
        </div>
        <button
          onClick={() => {
            setFormData(defaultFormData)
            setEditingCompany(null)
            setCreateUser(false)
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transition-all font-medium"
        >
          <Plus className="w-4 h-4" />
          Nueva Empresa
        </button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={companies}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />

      {/* View/Manage Users Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setViewingCompany(null)
          setCompanyUsers([])
          setShowAddUser(false)
        }}
        title={`Usuarios de ${viewingCompany?.name || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          {/* Company Info */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-teal-500/10 rounded-lg">
                <Building2 className="w-6 h-6 text-teal-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">{viewingCompany?.name}</h3>
                <p className="text-sm text-slate-400 mt-1">{viewingCompany?.slug}</p>
                {viewingCompany?.legalName && (
                  <p className="text-sm text-slate-400 mt-1">{viewingCompany.legalName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Users Section */}
          <div className="border-t border-slate-700 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-white flex items-center gap-2">
                <Users className="w-4 h-4" />
                Usuarios Asignados ({companyUsers.length})
              </h4>
              <button
                onClick={() => setShowAddUser(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Agregar Usuario
              </button>
            </div>

            {loadingUsers ? (
              <div className="text-center py-8 text-slate-400">Cargando usuarios...</div>
            ) : companyUsers.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No hay usuarios asignados a esta empresa
              </div>
            ) : (
              <div className="space-y-2">
                {companyUsers.map((cu) => (
                  <div
                    key={cu.userId}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-white">{cu.user.name}</div>
                      <div className="text-sm text-slate-400">{cu.user.email}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={cu.role}
                        onChange={(e) => handleUpdateUserRole(cu.userId, e.target.value)}
                        className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="ADMINISTRADOR">Administrador</option>
                        <option value="EJECUTIVO">Ejecutivo</option>
                        <option value="CONTABILIDAD">Contabilidad</option>
                        <option value="SOLO_LECTURA">Solo Lectura</option>
                      </select>
                      <button
                        onClick={() => handleRemoveUser(cu.userId)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                        title="Remover usuario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add User Form */}
            {showAddUser && (
              <div className="mt-4 p-4 bg-slate-800/80 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-medium text-white">Agregar Usuario</h5>
                  <button
                    onClick={() => {
                      setShowAddUser(false)
                      setSelectedUserId(null)
                      setSelectedRole('EJECUTIVO')
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Usuario</label>
                    <select
                      value={selectedUserId || ''}
                      onChange={(e) => setSelectedUserId(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-700 text-white text-sm rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Seleccionar usuario</option>
                      {availableUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Rol</label>
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
                <button
                  onClick={handleAddUser}
                  disabled={!selectedUserId}
                  className="mt-3 w-full px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Agregar Usuario
                </button>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setCreateUser(false)
          setFormData(defaultFormData)
          setEditingCompany(null)
        }}
        title={editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Nombre de la Empresa"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              required
              placeholder="Ej: Corredora Principal"
            />
            <FormInput
              label="Slug (URL)"
              value={formData.slug}
              onChange={(value) => setFormData({ ...formData, slug: value })}
              required
              placeholder="Ej: corredora-principal"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Razón Social"
              value={formData.legalName}
              onChange={(value) => setFormData({ ...formData, legalName: value })}
              placeholder="Nombre legal de la empresa"
            />
            <FormInput
              label="RNC"
              value={formData.rnc}
              onChange={(value) => setFormData({ ...formData, rnc: value })}
              placeholder="Ej: 131-00000-0"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Email"
              type="email"
              value={formData.email}
              onChange={(value) => setFormData({ ...formData, email: value })}
              placeholder="contacto@empresa.com"
            />
            <FormInput
              label="Teléfono"
              value={formData.phone}
              onChange={(value) => setFormData({ ...formData, phone: value })}
              placeholder="809-555-1234"
            />
          </div>

          <FormInput
            label="Estado"
            type="select"
            value={formData.status}
            onChange={(value) => setFormData({ ...formData, status: value as any })}
            options={[
              { value: 'ACTIVO', label: 'Activo' },
              { value: 'TRIAL', label: 'Prueba' },
              { value: 'SUSPENDIDO', label: 'Suspendido' },
              { value: 'CANCELADO', label: 'Cancelado' },
            ]}
          />

          {/* Initial User Creation (only when creating new company) */}
          {!editingCompany && (
            <div className="border-t border-slate-700 pt-4 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="createUser"
                  checked={createUser}
                  onChange={(e) => setCreateUser(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-teal-500 focus:ring-teal-500 focus:ring-offset-slate-800"
                />
                <label htmlFor="createUser" className="text-sm font-medium text-slate-300">
                  Crear usuario administrador inicial
                </label>
              </div>

              {createUser && (
                <div className="space-y-4 bg-slate-800/50 p-4 rounded-lg">
                  <p className="text-xs text-slate-400 mb-3">
                    Crea un usuario administrador que tendrá acceso completo a esta empresa
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <FormInput
                      label="Nombre del Usuario"
                      value={formData.initialUser.name}
                      onChange={(value) =>
                        setFormData({
                          ...formData,
                          initialUser: { ...formData.initialUser, name: value },
                        })
                      }
                      required={createUser}
                      placeholder="Ej: Juan Pérez"
                    />
                    <FormInput
                      label="Email del Usuario"
                      type="email"
                      value={formData.initialUser.email}
                      onChange={(value) =>
                        setFormData({
                          ...formData,
                          initialUser: { ...formData.initialUser, email: value },
                        })
                      }
                      required={createUser}
                      placeholder="usuario@empresa.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormInput
                      label="Contraseña"
                      type="password"
                      value={formData.initialUser.password}
                      onChange={(value) =>
                        setFormData({
                          ...formData,
                          initialUser: { ...formData.initialUser, password: value },
                        })
                      }
                      required={createUser}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <FormInput
                      label="Teléfono del Usuario"
                      value={formData.initialUser.phone}
                      onChange={(value) =>
                        setFormData({
                          ...formData,
                          initialUser: { ...formData.initialUser, phone: value },
                        })
                      }
                      placeholder="809-555-1234"
                    />
                  </div>

                  <FormInput
                    label="Rol en la Empresa"
                    type="select"
                    value={formData.initialUser.role}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        initialUser: { ...formData.initialUser, role: value as any },
                      })
                    }
                    options={[
                      { value: 'ADMINISTRADOR', label: 'Administrador' },
                      { value: 'EJECUTIVO', label: 'Ejecutivo' },
                      { value: 'CONTABILIDAD', label: 'Contabilidad' },
                      { value: 'SOLO_LECTURA', label: 'Solo Lectura' },
                    ]}
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowModal(false)
                setCreateUser(false)
                setFormData(defaultFormData)
                setEditingCompany(null)
              }}
              className="px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
            >
              {editingCompany ? 'Actualizar' : 'Crear'} Empresa
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
