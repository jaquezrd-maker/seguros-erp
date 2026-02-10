import { Users } from "lucide-react"
import { useState } from "react"
import useCrudModule from "../../hooks/useCrudModule"
import type { Client } from "../../types"
import { fmtDate } from "../../utils/format"
import StatusBadge from "../../components/ui/StatusBadge"
import DataTable from "../../components/ui/DataTable"
import SearchBar from "../../components/ui/SearchBar"
import StatCard from "../../components/ui/StatCard"
import Modal from "../../components/ui/Modal"
import FormInput from "../../components/ui/FormInput"
import ConfirmDialog from "../../components/ui/ConfirmDialog"
import ClientDetailModal from "./ClientDetailModal"

const defaultForm = {
  type: "FISICA", name: "", cedulaRnc: "", phone: "", email: "", address: "", city: "", province: "",
  contactPerson: "", contactPosition: "", purchasingManager: "", birthDate: "", notes: ""
}

export default function ClientsPage() {
  const crud = useCrudModule<Client>({ endpoint: "/clients", defaultForm })
  const [detailClientId, setDetailClientId] = useState<number | null>(null)

  const columns = [
    { key: "name", label: "Cliente" },
    { key: "cedulaRnc", label: "Cédula/RNC" },
    { key: "type", label: "Tipo", render: (v: string) => v === "FISICA" ? "Persona Física" : "Jurídica" },
    { key: "phone", label: "Teléfono", render: (v: string) => v || "—" },
    { key: "email", label: "Email", render: (v: string) => v || "—" },
    { key: "status", label: "Estado", render: (v: string) => <StatusBadge status={v} /> },
    { key: "createdAt", label: "Registro", render: (v: string) => fmtDate(v) },
  ]

  const handleSave = async () => {
    if (crud.modal === "create") await crud.createItem()
    else if (crud.modal === "edit" && crud.selected) await crud.updateItem(crud.selected.id)
  }

  const handleViewClient = (client: Client) => {
    setDetailClientId(client.id)
  }

  const handleChangeStatus = async (client: Client, newStatus: string) => {
    await crud.patchItem(client.id, "status", { status: newStatus })
  }

  const activeCount = crud.items.filter(c => c.status === "ACTIVO").length

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Clientes" value={crud.total} icon={Users} color="teal" />
        <StatCard title="Activos" value={activeCount} icon={Users} color="emerald" />
        <StatCard title="Inactivos" value={crud.total - activeCount} icon={Users} color="red" />
      </div>

      <SearchBar value={crud.search} onChange={crud.setSearch} placeholder="Buscar cliente..." onAdd={crud.openNew} addLabel="Nuevo Cliente" />

      {crud.error && <div className="bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl p-3 mb-4 text-sm">{crud.error}</div>}

      <DataTable columns={columns} data={crud.items} loading={crud.loading}
        onView={handleViewClient} onEdit={crud.openEdit} onDelete={crud.askDelete} />

      {detailClientId && (
        <ClientDetailModal clientId={detailClientId} onClose={() => setDetailClientId(null)} />
      )}

      <Modal isOpen={crud.modal === "create" || crud.modal === "edit"} onClose={crud.closeModal}
        title={crud.modal === "create" ? "Nuevo Cliente" : "Editar Cliente"} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label="Tipo" type="select" value={crud.form.type} onChange={v => crud.updateField("type", v)} required
            options={[{ value: "FISICA", label: "Persona Física" }, { value: "JURIDICA", label: "Persona Jurídica" }]} />
          <FormInput label="Nombre" value={crud.form.name} onChange={v => crud.updateField("name", v)} required />
          <FormInput label="Cédula / RNC" value={crud.form.cedulaRnc} onChange={v => crud.updateField("cedulaRnc", v)} required />
          <FormInput label="Teléfono" value={crud.form.phone} onChange={v => crud.updateField("phone", v)} />
          <FormInput label="Email" type="email" value={crud.form.email} onChange={v => crud.updateField("email", v)} />
          <FormInput label="Dirección" value={crud.form.address} onChange={v => crud.updateField("address", v)} />
          <FormInput label="Ciudad" value={crud.form.city} onChange={v => crud.updateField("city", v)} />
          <FormInput label="Provincia" value={crud.form.province} onChange={v => crud.updateField("province", v)} />
          <FormInput label="Persona de Contacto" value={crud.form.contactPerson} onChange={v => crud.updateField("contactPerson", v)} />
          <FormInput label="Cargo/Puesto" value={crud.form.contactPosition} onChange={v => crud.updateField("contactPosition", v)} />
          <FormInput label="Encargado de Compras" value={crud.form.purchasingManager} onChange={v => crud.updateField("purchasingManager", v)} />
          <FormInput label="Fecha de Cumpleaños" type="date" value={crud.form.birthDate} onChange={v => crud.updateField("birthDate", v)} />
          <div className="md:col-span-2">
            <FormInput label="Notas" type="textarea" value={crud.form.notes} onChange={v => crud.updateField("notes", v)} />
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

      <ConfirmDialog isOpen={!!crud.deleteTarget} title="Eliminar Cliente"
        message={`¿Está seguro de eliminar al cliente "${crud.deleteTarget?.name}"?`}
        onConfirm={crud.deleteItem} onCancel={crud.cancelDelete} loading={crud.saving} />
    </div>
  )
}
