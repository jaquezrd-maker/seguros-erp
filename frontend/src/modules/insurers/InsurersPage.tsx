import { Building2 } from "lucide-react"
import useCrudModule from "../../hooks/useCrudModule"
import type { Insurer } from "../../types"
import StatusBadge from "../../components/ui/StatusBadge"
import DataTable from "../../components/ui/DataTable"
import SearchBar from "../../components/ui/SearchBar"
import StatCard from "../../components/ui/StatCard"
import Modal from "../../components/ui/Modal"
import FormInput from "../../components/ui/FormInput"
import ConfirmDialog from "../../components/ui/ConfirmDialog"

const defaultForm = { name: "", rnc: "", legalName: "", phone: "", email: "", contactPerson: "", address: "" }

export default function InsurersPage() {
  const crud = useCrudModule<Insurer>({ endpoint: "/insurers", defaultForm })

  const columns = [
    { key: "name", label: "Aseguradora" },
    { key: "rnc", label: "RNC" },
    { key: "phone", label: "Teléfono", render: (v: string) => v || "—" },
    { key: "email", label: "Email", render: (v: string) => v || "—" },
    { key: "contactPerson", label: "Contacto", render: (v: string) => v || "—" },
    { key: "status", label: "Estado", render: (v: string) => <StatusBadge status={v} /> },
    { key: "_count", label: "Pólizas", render: (_: any, row: Insurer) => row._count?.policies ?? 0 },
  ]

  const handleSave = async () => {
    if (crud.modal === "create") await crud.createItem()
    else if (crud.modal === "edit" && crud.selected) await crud.updateItem(crud.selected.id)
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Aseguradoras" value={crud.total} icon={Building2} color="indigo" />
        <StatCard title="Activas" value={crud.items.filter(i => i.status === "ACTIVA").length} icon={Building2} color="emerald" />
        <StatCard title="Inactivas" value={crud.items.filter(i => i.status === "INACTIVA").length} icon={Building2} color="red" />
      </div>

      <SearchBar value={crud.search} onChange={crud.setSearch} placeholder="Buscar aseguradora..." onAdd={crud.openNew} addLabel="Nueva Aseguradora" />

      {crud.error && <div className="bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl p-3 mb-4 text-sm">{crud.error}</div>}
      {crud.success && <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl p-3 mb-4 text-sm">{crud.success}</div>}

      <DataTable columns={columns} data={crud.items} loading={crud.loading}
        onView={crud.openView} onEdit={crud.openEdit} onDelete={crud.askDelete} />

      <Modal isOpen={crud.modal === "view"} onClose={crud.closeModal} title="Detalle de Aseguradora" size="md">
        {crud.selected && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-slate-400">Nombre:</span> <span className="text-white ml-2">{crud.selected.name}</span></div>
              <div><span className="text-slate-400">RNC:</span> <span className="text-white ml-2">{crud.selected.rnc}</span></div>
              <div><span className="text-slate-400">Razón Social:</span> <span className="text-white ml-2">{crud.selected.legalName || "—"}</span></div>
              <div><span className="text-slate-400">Estado:</span> <span className="ml-2"><StatusBadge status={crud.selected.status} /></span></div>
              <div><span className="text-slate-400">Teléfono:</span> <span className="text-white ml-2">{crud.selected.phone || "—"}</span></div>
              <div><span className="text-slate-400">Email:</span> <span className="text-white ml-2">{crud.selected.email || "—"}</span></div>
              <div><span className="text-slate-400">Contacto:</span> <span className="text-white ml-2">{crud.selected.contactPerson || "—"}</span></div>
              <div className="col-span-2"><span className="text-slate-400">Dirección:</span> <span className="text-white ml-2">{crud.selected.address || "—"}</span></div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={crud.modal === "create" || crud.modal === "edit"} onClose={crud.closeModal}
        title={crud.modal === "create" ? "Nueva Aseguradora" : "Editar Aseguradora"} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label="Nombre" value={crud.form.name} onChange={v => crud.updateField("name", v)} required />
          <FormInput label="RNC" value={crud.form.rnc} onChange={v => crud.updateField("rnc", v)} required />
          <FormInput label="Razón Social" value={crud.form.legalName} onChange={v => crud.updateField("legalName", v)} />
          <FormInput label="Teléfono" value={crud.form.phone} onChange={v => crud.updateField("phone", v)} />
          <FormInput label="Email" type="email" value={crud.form.email} onChange={v => crud.updateField("email", v)} />
          <FormInput label="Persona de Contacto" value={crud.form.contactPerson} onChange={v => crud.updateField("contactPerson", v)} />
          <div className="md:col-span-2">
            <FormInput label="Dirección" value={crud.form.address} onChange={v => crud.updateField("address", v)} />
          </div>
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

      <ConfirmDialog isOpen={!!crud.deleteTarget} title="Deshabilitar Aseguradora"
        message={`¿Está seguro de deshabilitar la aseguradora "${crud.deleteTarget?.name}"? Esta acción cambiará su estado a INACTIVA.`}
        onConfirm={crud.deleteItem} onCancel={crud.cancelDelete} loading={crud.saving} />
    </div>
  )
}
