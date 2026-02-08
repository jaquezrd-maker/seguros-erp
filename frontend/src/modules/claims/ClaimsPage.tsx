import { useState, useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import useCrudModule from "../../hooks/useCrudModule"
import { api } from "../../api/client"
import type { Claim, Policy, PaginatedResponse } from "../../types"
import { fmt, fmtDate, toDateInput } from "../../utils/format"
import StatusBadge from "../../components/ui/StatusBadge"
import DataTable from "../../components/ui/DataTable"
import SearchBar from "../../components/ui/SearchBar"
import StatCard from "../../components/ui/StatCard"
import Modal from "../../components/ui/Modal"
import FormInput from "../../components/ui/FormInput"

const defaultForm = {
  policyId: "", type: "", dateOccurred: "", description: "", estimatedAmount: "", priority: "MEDIA"
}

export default function ClaimsPage() {
  const crud = useCrudModule<Claim>({ endpoint: "/claims", defaultForm })
  const [policies, setPolicies] = useState<Policy[]>([])

  useEffect(() => {
    api.get<PaginatedResponse<Policy>>("/policies?limit=500&status=VIGENTE").then(r => setPolicies(r.data)).catch(() => {})
  }, [])

  const columns = [
    { key: "claimNumber", label: "No. Siniestro" },
    { key: "policy", label: "Cliente", render: (_: any, row: Claim) => row.policy?.client?.name || "—" },
    { key: "type", label: "Tipo" },
    { key: "dateOccurred", label: "Fecha", render: (v: string) => fmtDate(v) },
    { key: "estimatedAmount", label: "Monto Est.", render: (v: number) => v ? fmt(v) : "—" },
    { key: "priority", label: "Prioridad", render: (v: string) => <StatusBadge status={v} /> },
    { key: "status", label: "Estado", render: (v: string) => <StatusBadge status={v} /> },
  ]

  const handleEdit = (item: Claim) => {
    crud.openEdit(item)
    crud.setForm((prev: Record<string, any>) => ({
      ...prev,
      dateOccurred: toDateInput(item.dateOccurred),
    }))
  }

  const handleSave = async () => {
    const data = {
      ...crud.form,
      policyId: Number(crud.form.policyId),
      estimatedAmount: crud.form.estimatedAmount ? Number(crud.form.estimatedAmount) : undefined,
    }
    if (crud.modal === "create") await crud.createItem(data)
    else if (crud.modal === "edit" && crud.selected) await crud.updateItem(crud.selected.id, data)
  }

  const pendientes = crud.items.filter(c => c.status === "PENDIENTE").length
  const totalEstimado = crud.items.reduce((s, c) => s + (c.estimatedAmount || 0), 0)

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Siniestros" value={crud.total} icon={AlertTriangle} color="red" />
        <StatCard title="Pendientes" value={pendientes} icon={AlertTriangle} color="amber" />
        <StatCard title="Monto Estimado" value={fmt(totalEstimado)} icon={AlertTriangle} color="indigo" />
        <StatCard title="Aprobados" value={crud.items.filter(c => c.status === "APROBADO").length} icon={AlertTriangle} color="emerald" />
      </div>

      <SearchBar value={crud.search} onChange={crud.setSearch} placeholder="Buscar siniestro..." onAdd={crud.openNew} addLabel="Nuevo Siniestro" />

      {crud.success && <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl p-3 mb-4 text-sm">{crud.success}</div>}
      {crud.error && <div className="bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl p-3 mb-4 text-sm">{crud.error}</div>}

      <DataTable columns={columns} data={crud.items} loading={crud.loading}
        onView={crud.openView} onEdit={handleEdit} onDelete={crud.askDelete} />

      <Modal isOpen={crud.modal === "view"} onClose={crud.closeModal} title="Detalle del Siniestro" size="lg">
        {crud.selected && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-slate-400">No. Siniestro:</span> <span className="text-white ml-2">{crud.selected.claimNumber}</span></div>
              <div><span className="text-slate-400">Estado:</span> <span className="ml-2"><StatusBadge status={crud.selected.status} /></span></div>
              <div><span className="text-slate-400">Cliente:</span> <span className="text-white ml-2">{crud.selected.policy?.client?.name || "—"}</span></div>
              <div><span className="text-slate-400">Aseguradora:</span> <span className="text-white ml-2">{crud.selected.policy?.insurer?.name || "—"}</span></div>
              <div><span className="text-slate-400">Tipo:</span> <span className="text-white ml-2">{crud.selected.type}</span></div>
              <div><span className="text-slate-400">Prioridad:</span> <span className="ml-2"><StatusBadge status={crud.selected.priority} /></span></div>
              <div><span className="text-slate-400">Fecha:</span> <span className="text-white ml-2">{fmtDate(crud.selected.dateOccurred)}</span></div>
              <div><span className="text-slate-400">Monto Estimado:</span> <span className="text-white ml-2">{crud.selected.estimatedAmount ? fmt(crud.selected.estimatedAmount) : "—"}</span></div>
              {crud.selected.approvedAmount && <div><span className="text-slate-400">Monto Aprobado:</span> <span className="text-white ml-2">{fmt(crud.selected.approvedAmount)}</span></div>}
            </div>
            {crud.selected.description && <div><span className="text-slate-400">Descripción:</span> <p className="text-white mt-1">{crud.selected.description}</p></div>}
            {crud.selected.status === "PENDIENTE" && (
              <div className="flex gap-2 pt-4 border-t border-slate-700">
                <button onClick={() => crud.patchItem(crud.selected!.id, "status", { status: "EN_PROCESO" })}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm transition-colors">Iniciar Proceso</button>
                <button onClick={() => crud.patchItem(crud.selected!.id, "status", { status: "RECHAZADO" })}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm transition-colors">Rechazar</button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={crud.modal === "create" || crud.modal === "edit"} onClose={crud.closeModal}
        title={crud.modal === "create" ? "Nuevo Siniestro" : "Editar Siniestro"} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label="Póliza" type="select" value={crud.form.policyId} onChange={v => crud.updateField("policyId", v)} required
            options={policies.map(p => ({ value: p.id, label: `${p.policyNumber} - ${p.client?.name || ""}` }))} />
          <FormInput label="Tipo de Siniestro" value={crud.form.type} onChange={v => crud.updateField("type", v)} required />
          <FormInput label="Fecha del Siniestro" type="date" value={crud.form.dateOccurred} onChange={v => crud.updateField("dateOccurred", v)} required />
          <FormInput label="Prioridad" type="select" value={crud.form.priority} onChange={v => crud.updateField("priority", v)}
            options={["BAJA", "MEDIA", "ALTA", "CRITICA"]} />
          <FormInput label="Monto Estimado (DOP)" type="number" value={crud.form.estimatedAmount} onChange={v => crud.updateField("estimatedAmount", v)} />
          <div className="md:col-span-2">
            <FormInput label="Descripción" type="textarea" value={crud.form.description} onChange={v => crud.updateField("description", v)} />
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

      <Modal isOpen={!!crud.deleteTarget} onClose={crud.cancelDelete} title="Eliminar Siniestro" size="md">
        {crud.deleteTarget && (
          <div className="space-y-4">
            <p className="text-slate-300 text-sm">
              ¿Qué desea hacer con el siniestro <span className="font-semibold text-white">{crud.deleteTarget.claimNumber}</span>?
            </p>
            
            <div className="space-y-3">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <h4 className="text-amber-400 font-semibold mb-2 text-sm">Rechazar Siniestro (Recomendado)</h4>
                <p className="text-slate-400 text-xs mb-3">
                  El siniestro se marcará como RECHAZADO pero se mantendrá en el historial.
                </p>
                <button
                  onClick={() => crud.deleteItem(false)}
                  disabled={crud.saving}
                  className="w-full px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {crud.saving ? "Procesando..." : "Rechazar Siniestro"}
                </button>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <h4 className="text-red-400 font-semibold mb-2 text-sm flex items-center gap-2">
                  <span>⚠️</span> Eliminar Permanentemente
                </h4>
                <p className="text-slate-400 text-xs mb-3">
                  El siniestro se eliminará completamente de la base de datos (incluyendo todas sus notas). Esta acción NO se puede deshacer.
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
