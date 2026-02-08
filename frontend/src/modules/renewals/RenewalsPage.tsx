import { RefreshCw } from "lucide-react"
import useCrudModule from "../../hooks/useCrudModule"
import type { Renewal } from "../../types"
import { fmt, fmtDate } from "../../utils/format"
import StatusBadge from "../../components/ui/StatusBadge"
import DataTable from "../../components/ui/DataTable"
import SearchBar from "../../components/ui/SearchBar"
import StatCard from "../../components/ui/StatCard"
import Modal from "../../components/ui/Modal"
import ConfirmDialog from "../../components/ui/ConfirmDialog"
import { useState } from "react"
import { api } from "../../api/client"

function daysLeft(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function RenewalsPage() {
  const crud = useCrudModule<Renewal>({ endpoint: "/renewals" })
  const [editData, setEditData] = useState({ newEndDate: "", newPremium: "" })
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!confirm("¿Generar renovaciones para todas las pólizas próximas a vencer?")) return
    setGenerating(true)
    try {
      const res = await api.post<{ success: boolean; message: string; data: any }>("/renewals/generate", {})
      if (res.success) {
        alert(res.message)
        crud.fetchItems()
      } else {
        alert("Error: " + res.message)
      }
    } catch (error: any) {
      alert("Error al generar renovaciones: " + (error.response?.data?.message || error.message))
    } finally {
      setGenerating(false)
    }
  }

  const handleEdit = (item: Renewal) => {
    setEditData({
      newEndDate: item.newEndDate || "",
      newPremium: item.newPremium?.toString() || "",
    })
    crud.openEdit(item)
  }

  const handleSaveEdit = async () => {
    if (!crud.selected) return
    const data: any = {}
    if (editData.newEndDate) data.newEndDate = editData.newEndDate
    if (editData.newPremium) data.newPremium = parseFloat(editData.newPremium)
    await crud.updateItem(crud.selected.id, data)
    setEditData({ newEndDate: "", newPremium: "" })
  }

  const columns = [
    { key: "policy", label: "Póliza", render: (_: any, row: Renewal) => row.policy?.policyNumber || "—" },
    { key: "client", label: "Cliente", render: (_: any, row: Renewal) => row.policy?.client?.name || "—" },
    { key: "insurer", label: "Aseguradora", render: (_: any, row: Renewal) => row.policy?.insurer?.name || "—" },
    { key: "type", label: "Ramo", render: (_: any, row: Renewal) => row.policy?.insuranceType?.name || "—" },
    { key: "originalEndDate", label: "Vencimiento", render: (v: string) => fmtDate(v) },
    { key: "days", label: "Días", render: (_: any, row: Renewal) => {
      const d = daysLeft(row.originalEndDate)
      const color = d < 0 ? "text-red-400" : d <= 30 ? "text-amber-400" : "text-emerald-400"
      return <span className={color}>{d} días</span>
    }},
    { key: "status", label: "Estado", render: (v: string) => <StatusBadge status={v} /> },
  ]

  const pendientes = crud.items.filter(r => r.status === "PENDIENTE").length
  const vencidas = crud.items.filter(r => daysLeft(r.originalEndDate) < 0).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Renovaciones</h1>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Generando...' : 'Generar Renovaciones'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Renovaciones" value={crud.total} icon={RefreshCw} color="teal" />
        <StatCard title="Pendientes" value={pendientes} icon={RefreshCw} color="amber" />
        <StatCard title="Vencidas" value={vencidas} icon={RefreshCw} color="red" />
        <StatCard title="Procesadas" value={crud.items.filter(r => r.status === "PROCESADA").length} icon={RefreshCw} color="emerald" />
      </div>

      <SearchBar value={crud.search} onChange={crud.setSearch} placeholder="Buscar renovación..." />

      {crud.error && <div className="bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl p-3 mb-4 text-sm">{crud.error}</div>}

      <DataTable columns={columns} data={crud.items} loading={crud.loading}
        onView={crud.openView} onEdit={handleEdit} onDelete={crud.askDelete} />

      <Modal isOpen={crud.modal === "view"} onClose={crud.closeModal} title="Detalle de Renovación" size="md">
        {crud.selected && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-slate-400">Póliza:</span> <span className="text-white ml-2">{crud.selected.policy?.policyNumber || "—"}</span></div>
              <div><span className="text-slate-400">Estado:</span> <span className="ml-2"><StatusBadge status={crud.selected.status} /></span></div>
              <div><span className="text-slate-400">Cliente:</span> <span className="text-white ml-2">{crud.selected.policy?.client?.name || "—"}</span></div>
              <div><span className="text-slate-400">Aseguradora:</span> <span className="text-white ml-2">{crud.selected.policy?.insurer?.name || "—"}</span></div>
              <div><span className="text-slate-400">Vencimiento:</span> <span className="text-white ml-2">{fmtDate(crud.selected.originalEndDate)}</span></div>
              <div><span className="text-slate-400">Días Restantes:</span> <span className="text-white ml-2">{daysLeft(crud.selected.originalEndDate)} días</span></div>
              {crud.selected.newEndDate && <div><span className="text-slate-400">Nuevo Vencimiento:</span> <span className="text-white ml-2">{fmtDate(crud.selected.newEndDate)}</span></div>}
              {crud.selected.newPremium && <div><span className="text-slate-400">Nueva Prima:</span> <span className="text-white ml-2">{fmt(crud.selected.newPremium)}</span></div>}
            </div>
            {crud.selected.status === "PENDIENTE" && (
              <div className="flex gap-2 pt-4 border-t border-slate-700">
                <button onClick={() => { crud.patchItem(crud.selected!.id, "notify", {}); }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm transition-colors">
                  Notificar Cliente
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={crud.modal === "edit"} onClose={crud.closeModal} title="Editar Renovación" size="md">
        {crud.selected && crud.selected.status === "PENDIENTE" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Nueva Fecha de Vencimiento</label>
              <input
                type="date"
                value={editData.newEndDate}
                onChange={(e) => setEditData({ ...editData, newEndDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Nueva Prima (opcional)</label>
              <input
                type="number"
                step="0.01"
                value={editData.newPremium}
                onChange={(e) => setEditData({ ...editData, newPremium: e.target.value })}
                placeholder="RD$ 0.00"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors"
              >
                Guardar Cambios
              </button>
              <button
                onClick={crud.closeModal}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
        {crud.selected && crud.selected.status !== "PENDIENTE" && (
          <div className="text-amber-400 text-sm">
            Solo se pueden editar renovaciones pendientes
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!crud.deleteTarget} title="Eliminar Renovación"
        message={`¿Está seguro de eliminar la renovación de la póliza "${crud.deleteTarget?.policy?.policyNumber}"?`}
        onConfirm={crud.deleteItem} onCancel={crud.cancelDelete} loading={crud.saving} />
    </div>
  )
}
