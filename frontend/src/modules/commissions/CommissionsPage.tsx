import { DollarSign } from "lucide-react"
import { useState, useEffect } from "react"
import useCrudModule from "../../hooks/useCrudModule"
import type { Commission, Policy, User, PaginatedResponse } from "../../types"
import { fmt, fmtDate } from "../../utils/format"
import StatusBadge from "../../components/ui/StatusBadge"
import DataTable from "../../components/ui/DataTable"
import SearchBar from "../../components/ui/SearchBar"
import StatCard from "../../components/ui/StatCard"
import Modal from "../../components/ui/Modal"
import FormInput from "../../components/ui/FormInput"
import { api } from "../../api/client"

export default function CommissionsPage() {
  const crud = useCrudModule<Commission>({
    endpoint: "/commissions",
    defaultForm: {
      policyId: "",
      producerId: "",
      premiumAmount: "",
      rate: "",
      period: new Date().toISOString().slice(0, 7) // YYYY-MM format
    }
  })

  const columns = [
    { key: "producer", label: "Productor", render: (_: any, row: Commission) => row.producer?.name || "—" },
    { key: "policy", label: "Póliza", render: (_: any, row: Commission) => row.policy?.policyNumber || "—" },
    { key: "policy2", label: "Cliente", render: (_: any, row: Commission) => row.policy?.client?.name || "—" },
    { key: "premiumAmount", label: "Prima", render: (v: number) => fmt(v) },
    { key: "rate", label: "Tasa %", render: (v: number) => `${v}%` },
    { key: "amount", label: "Comisión", render: (v: number) => fmt(v) },
    { key: "period", label: "Período" },
    { key: "status", label: "Estado", render: (v: string) => <StatusBadge status={v} /> },
  ]

  const totalPendiente = crud.summary?.totalPendiente ?? 0
  const totalPagada = crud.summary?.totalPagado ?? 0
  const pendienteCount = crud.summary?.pendienteCount ?? 0

  const [policies, setPolicies] = useState<Policy[]>([])
  const [producers, setProducers] = useState<User[]>([])

  useEffect(() => {
    api.get<PaginatedResponse<Policy>>("/policies?limit=500").then(r => setPolicies(r.data)).catch(() => {})
    api.get<PaginatedResponse<User>>("/users?limit=500").then(r => setProducers(r.data)).catch(() => {})
  }, [])

  const handleMarkPaid = async (commission: Commission) => {
    await crud.patchItem(commission.id, "pay", {})
  }

  const handleSave = async () => {
    const data = {
      policyId: Number(crud.form.policyId),
      producerId: Number(crud.form.producerId),
      premiumAmount: Number(crud.form.premiumAmount),
      rate: Number(crud.form.rate),
      period: crud.form.period
    }
    if (crud.modal === "create") await crud.createItem(data)
    else if (crud.selected) await crud.updateItem(crud.selected.id, data)
  }

  // Check if there's a permission error
  const hasPermissionError = crud.error && (crud.error.includes("permisos") || crud.error.includes("403"))

  if (hasPermissionError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Comisiones</h1>
        <div className="bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl p-6 text-center">
          <p className="text-lg font-semibold mb-2">⚠️ Acceso Restringido</p>
          <p className="text-sm">
            No tiene permisos para acceder al módulo de comisiones.
            <br />
            Este módulo requiere rol de <strong>ADMINISTRADOR</strong> o <strong>CONTABILIDAD</strong>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Comisiones</h1>
        <button onClick={crud.openNew}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Nueva Comisión
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Comisiones" value={crud.total} icon={DollarSign} color="teal" />
        <StatCard title="Total Pagado" value={fmt(totalPagada)} icon={DollarSign} color="emerald" />
        <StatCard title="Pendiente" value={fmt(totalPendiente)} icon={DollarSign} color="amber" />
        <StatCard title="Comisiones Pendientes" value={pendienteCount} icon={DollarSign} color="red" />
      </div>

      <SearchBar value={crud.search} onChange={crud.setSearch} placeholder="Buscar comisión..." />

      {crud.error && !hasPermissionError && <div className="bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl p-3 mb-4 text-sm">{crud.error}</div>}
      {crud.success && <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl p-3 mb-4 text-sm">{crud.success}</div>}

      <DataTable columns={columns} data={crud.items} loading={crud.loading}
        onView={crud.openView} onDelete={crud.askDelete} />

      <Modal isOpen={crud.modal === "view"} onClose={crud.closeModal} title="Detalle de Comisión" size="md">
        {crud.selected && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-slate-400">Productor:</span> <span className="text-white ml-2">{crud.selected.producer?.name || "—"}</span></div>
              <div><span className="text-slate-400">Estado:</span> <span className="ml-2"><StatusBadge status={crud.selected.status} /></span></div>
              <div><span className="text-slate-400">Póliza:</span> <span className="text-white ml-2">{crud.selected.policy?.policyNumber || "—"}</span></div>
              <div><span className="text-slate-400">Cliente:</span> <span className="text-white ml-2">{crud.selected.policy?.client?.name || "—"}</span></div>
              <div><span className="text-slate-400">Prima:</span> <span className="text-white ml-2">{fmt(crud.selected.premiumAmount)}</span></div>
              <div><span className="text-slate-400">Tasa:</span> <span className="text-white ml-2">{crud.selected.rate}%</span></div>
              <div><span className="text-slate-400">Comisión:</span> <span className="text-white ml-2">{fmt(crud.selected.amount)}</span></div>
              <div><span className="text-slate-400">Período:</span> <span className="text-white ml-2">{crud.selected.period}</span></div>
              {crud.selected.paidDate && <div><span className="text-slate-400">Fecha Pago:</span> <span className="text-white ml-2">{fmtDate(crud.selected.paidDate)}</span></div>}
            </div>
            {crud.selected.status === "PENDIENTE" && (
              <div className="pt-4 border-t border-slate-700">
                <button onClick={() => handleMarkPaid(crud.selected!)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm transition-colors">
                  Marcar como Pagada
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={crud.modal === "create" || crud.modal === "edit"} onClose={crud.closeModal}
        title={crud.modal === "create" ? "Nueva Comisión" : "Editar Comisión"} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label="Póliza" type="select" value={crud.form.policyId} onChange={v => crud.updateField("policyId", v)} required
            options={policies.map(p => ({ value: p.id, label: `${p.policyNumber} - ${p.client?.name || ""}` }))} />
          <FormInput label="Productor" type="select" value={crud.form.producerId} onChange={v => crud.updateField("producerId", v)} required
            options={producers.filter(u => u.role === "EJECUTIVO" || u.role === "ADMINISTRADOR").map(u => ({ value: u.id, label: u.name }))} />
          <FormInput label="Monto Prima (DOP)" type="number" value={crud.form.premiumAmount} onChange={v => crud.updateField("premiumAmount", v)} required />
          <FormInput label="Tasa %" type="number" value={crud.form.rate} onChange={v => crud.updateField("rate", v)} required placeholder="Ej: 18" />
          <FormInput label="Período (YYYY-MM)" value={crud.form.period} onChange={v => crud.updateField("period", v)} required placeholder="Ej: 2024-10" />
        </div>
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-xs text-blue-300">
            ℹ️ El monto de la comisión se calculará automáticamente: (Prima × Tasa) ÷ 100
            {crud.form.premiumAmount && crud.form.rate && (
              <span className="block mt-1 font-semibold">
                Comisión: {fmt((Number(crud.form.premiumAmount) * Number(crud.form.rate)) / 100)}
              </span>
            )}
          </p>
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

      <Modal isOpen={!!crud.deleteTarget} onClose={crud.cancelDelete} title="Eliminar Comisión" size="md">
        {crud.deleteTarget && (
          <div className="space-y-4">
            <p className="text-slate-300 text-sm">
              ¿Qué desea hacer con la comisión de <span className="font-semibold text-white">{fmt(crud.deleteTarget.amount)}</span>?
            </p>
            
            <div className="space-y-3">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <h4 className="text-amber-400 font-semibold mb-2 text-sm">Anular Comisión (Recomendado)</h4>
                <p className="text-slate-400 text-xs mb-3">
                  La comisión se marcará como ANULADA pero se mantendrá en el historial.
                  Nota: No se pueden anular comisiones pagadas.
                </p>
                <button
                  onClick={() => crud.deleteItem(false)}
                  disabled={crud.saving}
                  className="w-full px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {crud.saving ? "Procesando..." : "Anular Comisión"}
                </button>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <h4 className="text-red-400 font-semibold mb-2 text-sm flex items-center gap-2">
                  <span>⚠️</span> Eliminar Permanentemente
                </h4>
                <p className="text-slate-400 text-xs mb-3">
                  La comisión se eliminará completamente de la base de datos. Esta acción NO se puede deshacer.
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
