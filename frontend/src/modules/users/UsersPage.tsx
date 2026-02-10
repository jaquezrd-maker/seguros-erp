import { Lock } from "lucide-react"
import useCrudModule from "../../hooks/useCrudModule"
import type { ERPUser } from "../../types"
import { fmtDate } from "../../utils/format"
import StatusBadge from "../../components/ui/StatusBadge"
import DataTable from "../../components/ui/DataTable"
import SearchBar from "../../components/ui/SearchBar"
import StatCard from "../../components/ui/StatCard"
import Modal from "../../components/ui/Modal"
import FormInput from "../../components/ui/FormInput"

const defaultForm = { name: "", email: "", role: "EJECUTIVO", phone: "", password: "" }

export default function UsersPage() {
  const crud = useCrudModule<ERPUser>({ endpoint: "/users", defaultForm })

  const columns = [
    { key: "name", label: "Nombre" },
    { key: "email", label: "Email" },
    { key: "role", label: "Rol", render: (v: string) => <StatusBadge status={v.toLowerCase()} /> },
    { key: "phone", label: "Teléfono", render: (v: string) => v || "—" },
    { key: "status", label: "Estado", render: (v: string) => <StatusBadge status={v} /> },
    { key: "lastLogin", label: "Último Acceso", render: (v: string) => v ? fmtDate(v) : "Nunca" },
  ]

  const handleSave = async () => {
    if (crud.modal === "create") await crud.createItem()
    else if (crud.modal === "edit" && crud.selected) await crud.updateItem(crud.selected.id)
  }

  const handleToggleStatus = async (user: ERPUser) => {
    const newStatus = user.status === "ACTIVO" ? "INACTIVO" : "ACTIVO"
    await crud.patchItem(user.id, "status", { status: newStatus })
  }

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

      <Modal isOpen={crud.modal === "view"} onClose={crud.closeModal} title="Detalle del Usuario" size="md">
        {crud.selected && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-slate-400">Nombre:</span> <span className="text-white ml-2">{crud.selected.name}</span></div>
              <div><span className="text-slate-400">Email:</span> <span className="text-white ml-2">{crud.selected.email}</span></div>
              <div><span className="text-slate-400">Rol:</span> <span className="text-white ml-2">{crud.selected.role}</span></div>
              <div><span className="text-slate-400">Estado:</span> <span className="ml-2"><StatusBadge status={crud.selected.status} /></span></div>
              <div><span className="text-slate-400">Teléfono:</span> <span className="text-white ml-2">{crud.selected.phone || "—"}</span></div>
              <div><span className="text-slate-400">Último Acceso:</span> <span className="text-white ml-2">{crud.selected.lastLogin ? fmtDate(crud.selected.lastLogin) : "Nunca"}</span></div>
            </div>
            <div className="pt-4 border-t border-slate-700">
              <button onClick={() => handleToggleStatus(crud.selected!)}
                className={`px-4 py-2 rounded-xl text-white text-sm transition-colors ${crud.selected.status === "ACTIVO" ? "bg-red-600 hover:bg-red-500" : "bg-emerald-600 hover:bg-emerald-500"}`}>
                {crud.selected.status === "ACTIVO" ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={crud.modal === "create" || crud.modal === "edit"} onClose={crud.closeModal}
        title={crud.modal === "create" ? "Nuevo Usuario" : "Editar Usuario"} size="md">
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
          <FormInput label="Rol" type="select" value={crud.form.role} onChange={v => crud.updateField("role", v)} required
            options={[
              { value: "ADMINISTRADOR", label: "Administrador" },
              { value: "EJECUTIVO", label: "Ejecutivo de Seguros" },
              { value: "CONTABILIDAD", label: "Contabilidad" },
              { value: "SOLO_LECTURA", label: "Solo Lectura" },
            ]} />
          <FormInput label="Teléfono" value={crud.form.phone} onChange={v => crud.updateField("phone", v)} />
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
    </div>
  )
}
