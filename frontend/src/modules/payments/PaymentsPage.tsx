import { useState, useEffect } from "react"
import { CreditCard } from "lucide-react"
import useCrudModule from "../../hooks/useCrudModule"
import { api } from "../../api/client"
import type { Payment, Policy, PaginatedResponse } from "../../types"
import { fmt, fmtDate, toDateInput } from "../../utils/format"
import StatusBadge from "../../components/ui/StatusBadge"
import DataTable from "../../components/ui/DataTable"
import SearchBar from "../../components/ui/SearchBar"
import StatCard from "../../components/ui/StatCard"
import Modal from "../../components/ui/Modal"
import FormInput from "../../components/ui/FormInput"
import ConfirmDialog from "../../components/ui/ConfirmDialog"

const defaultForm = {
  policyId: "", clientId: "", amount: "", paymentMethod: "TRANSFERENCIA",
  paymentDate: new Date().toISOString().split("T")[0], dueDate: "", receiptNumber: "", notes: ""
}

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("")
  const crud = useCrudModule<Payment>({ 
    endpoint: `/payments${statusFilter ? `?status=${statusFilter}` : ""}`, 
    defaultForm 
  })
  const [policies, setPolicies] = useState<Policy[]>([])
  const [clientBalance, setClientBalance] = useState<{ pending: number; completed: number; total: number } | null>(null)

  useEffect(() => {
    api.get<PaginatedResponse<Policy>>("/policies?limit=500&status=VIGENTE").then(r => setPolicies(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    crud.fetchItems()
  }, [statusFilter])

  const columns = [
    { key: "receiptNumber", label: "Recibo", render: (v: string) => v || "—" },
    { key: "client", label: "Cliente", render: (_: any, row: Payment) => row.client?.name || row.policy?.client?.name || "—" },
    { key: "policy", label: "Póliza", render: (_: any, row: Payment) => row.policy?.policyNumber || "—" },
    { key: "amount", label: "Monto", render: (v: number) => fmt(v) },
    { key: "paymentMethod", label: "Método" },
    { key: "paymentDate", label: "Fecha Pago", render: (v: string) => fmtDate(v) },
    { key: "dueDate", label: "Vencimiento", render: (v: string) => v ? fmtDate(v) : "—" },
    { key: "status", label: "Estado", render: (v: string) => <StatusBadge status={v} /> },
  ]

  const handlePolicyChange = (policyId: string) => {
    crud.updateField("policyId", policyId)
    const policy = policies.find(p => p.id === Number(policyId))
    if (policy) {
      crud.updateField("clientId", String(policy.clientId))
      // Fetch client balance
      api.get<{ success: boolean; data: any }>(`/clients/${policy.clientId}`)
        .then(r => {
          if (r.data.balance) {
            setClientBalance(r.data.balance)
          }
        })
        .catch(() => {})
    }
  }

  const handleEdit = (item: Payment) => {
    crud.openEdit(item)
    crud.setForm((prev: Record<string, any>) => ({
      ...prev,
      paymentDate: toDateInput(item.paymentDate),
      dueDate: toDateInput(item.dueDate),
    }))
  }

  const handleSave = async () => {
    const data = {
      ...crud.form,
      policyId: Number(crud.form.policyId),
      clientId: Number(crud.form.clientId),
      amount: Number(crud.form.amount),
    }
    if (crud.modal === "create") await crud.createItem(data)
    else if (crud.modal === "edit" && crud.selected) await crud.updateItem(crud.selected.id, data)
  }

  const totalCobrado = crud.summary?.totalCobrado ?? 0
  const totalPendiente = crud.summary?.totalPendiente ?? 0
  const completedCount = crud.summary?.completedCount ?? 0

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Pagos" value={crud.total} icon={CreditCard} color="teal" />
        <StatCard title="Cobrado" value={fmt(totalCobrado)} icon={CreditCard} color="emerald" />
        <StatCard title="Pendiente" value={fmt(totalPendiente)} icon={CreditCard} color="amber" />
        <StatCard title="Completados" value={completedCount} icon={CreditCard} color="indigo" />
      </div>

      <SearchBar value={crud.search} onChange={crud.setSearch} placeholder="Buscar pago..." onAdd={crud.openNew} addLabel="Registrar Pago" />

      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setStatusFilter("")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === "" 
              ? "bg-teal-600 text-white" 
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setStatusFilter("PENDIENTE")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === "PENDIENTE" 
              ? "bg-amber-600 text-white" 
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setStatusFilter("COMPLETADO")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === "COMPLETADO" 
              ? "bg-emerald-600 text-white" 
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          Completados
        </button>
        <button
          onClick={() => setStatusFilter("VENCIDO")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === "VENCIDO" 
              ? "bg-orange-600 text-white" 
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          Vencidos
        </button>
        <button
          onClick={() => setStatusFilter("ANULADO")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === "ANULADO" 
              ? "bg-red-600 text-white" 
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          Anulados
        </button>
      </div>

      {crud.success && <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl p-3 mb-4 text-sm">{crud.success}</div>}
      {crud.error && <div className="bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl p-3 mb-4 text-sm">{crud.error}</div>}

      <DataTable columns={columns} data={crud.items} loading={crud.loading}
        onView={crud.openView} onEdit={handleEdit} onDelete={crud.askDelete} />

      <Modal isOpen={crud.modal === "view"} onClose={crud.closeModal} title="Detalle del Pago" size="md">
        {crud.selected && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-slate-400">Recibo:</span> <span className="text-white ml-2">{crud.selected.receiptNumber || "—"}</span></div>
              <div><span className="text-slate-400">Estado:</span> <span className="ml-2"><StatusBadge status={crud.selected.status} /></span></div>
              <div><span className="text-slate-400">Cliente:</span> <span className="text-white ml-2">{crud.selected.client?.name || "—"}</span></div>
              <div><span className="text-slate-400">Póliza:</span> <span className="text-white ml-2">{crud.selected.policy?.policyNumber || "—"}</span></div>
              <div><span className="text-slate-400">Monto:</span> <span className="text-white ml-2">{fmt(crud.selected.amount)}</span></div>
              <div><span className="text-slate-400">Método:</span> <span className="text-white ml-2">{crud.selected.paymentMethod}</span></div>
              <div><span className="text-slate-400">Fecha Pago:</span> <span className="text-white ml-2">{fmtDate(crud.selected.paymentDate)}</span></div>
              <div><span className="text-slate-400">Fecha Vencimiento:</span> <span className="text-white ml-2">{fmtDate(crud.selected.dueDate)}</span></div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={crud.modal === "create" || crud.modal === "edit"} onClose={crud.closeModal}
        title={crud.modal === "create" ? "Registrar Pago" : "Editar Pago"} size="lg">
        {clientBalance && crud.modal === "create" && (
          <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
            <p className="text-xs text-slate-400 mb-2">Balance del Cliente:</p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Pendiente</p>
                <p className="text-amber-400 font-semibold">{fmt(clientBalance.pending)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Completado</p>
                <p className="text-emerald-400 font-semibold">{fmt(clientBalance.completed)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Pendiente</p>
                <p className="text-red-400 font-semibold">{fmt(clientBalance.total)}</p>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label="Póliza" type="select" value={crud.form.policyId} onChange={handlePolicyChange} required
            options={policies.map(p => ({ value: p.id, label: `${p.policyNumber} - ${p.client?.name || ""}` }))} />
          <FormInput label="Monto (DOP)" type="number" value={crud.form.amount} onChange={v => crud.updateField("amount", v)} required />
          <FormInput label="Método de Pago" type="select" value={crud.form.paymentMethod} onChange={v => crud.updateField("paymentMethod", v)} required
            options={["TRANSFERENCIA", "CHEQUE", "EFECTIVO", "TARJETA"]} />
          <FormInput label="Fecha de Pago" type="date" value={crud.form.paymentDate} onChange={v => crud.updateField("paymentDate", v)} required />
          <FormInput label="Fecha de Vencimiento" type="date" value={crud.form.dueDate} onChange={v => crud.updateField("dueDate", v)} />
          {crud.modal === "edit" && (
            <FormInput label="No. Recibo" value={crud.form.receiptNumber} onChange={v => crud.updateField("receiptNumber", v)} />
          )}
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

      <ConfirmDialog
        isOpen={!!crud.deleteTarget}
        title="Anular Pago"
        message={`¿Está seguro de anular el pago de ${crud.deleteTarget ? fmt(crud.deleteTarget.amount) : ""}? El pago se marcará como ANULADO pero se mantendrá en el historial.`}
        onConfirm={crud.deleteItem}
        onCancel={crud.cancelDelete}
        loading={crud.saving}
      />
    </div>
  )
}
