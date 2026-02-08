import { DollarSign } from "lucide-react"
import useCrudModule from "../../hooks/useCrudModule"
import type { Commission } from "../../types"
import { fmt, fmtDate } from "../../utils/format"
import StatusBadge from "../../components/ui/StatusBadge"
import DataTable from "../../components/ui/DataTable"
import SearchBar from "../../components/ui/SearchBar"
import StatCard from "../../components/ui/StatCard"
import Modal from "../../components/ui/Modal"

export default function CommissionsPage() {
  const crud = useCrudModule<Commission>({ endpoint: "/commissions" })

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

  const handleMarkPaid = async (commission: Commission) => {
    await crud.patchItem(commission.id, "pay", {})
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Comisiones" value={crud.total} icon={DollarSign} color="teal" />
        <StatCard title="Total Pagado" value={fmt(totalPagada)} icon={DollarSign} color="emerald" />
        <StatCard title="Pendiente" value={fmt(totalPendiente)} icon={DollarSign} color="amber" />
        <StatCard title="Comisiones Pendientes" value={pendienteCount} icon={DollarSign} color="red" />
      </div>

      <SearchBar value={crud.search} onChange={crud.setSearch} placeholder="Buscar comisión..." />

      {crud.error && <div className="bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl p-3 mb-4 text-sm">{crud.error}</div>}
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
