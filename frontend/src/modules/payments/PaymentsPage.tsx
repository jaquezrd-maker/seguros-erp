import { useState, useEffect } from "react"
import { CreditCard, Printer, Mail } from "lucide-react"
import useCrudModule from "../../hooks/useCrudModule"
import { api, getAuthHeaders } from "../../api/client"
import type { Payment, Policy, PaginatedResponse } from "../../types"
import { fmt, fmtDate, toDateInput } from "../../utils/format"
import StatusBadge from "../../components/ui/StatusBadge"
import DataTable from "../../components/ui/DataTable"
import SearchBar from "../../components/ui/SearchBar"
import StatCard from "../../components/ui/StatCard"
import Modal from "../../components/ui/Modal"
import FormInput from "../../components/ui/FormInput"
import ConfirmDialog from "../../components/ui/ConfirmDialog"
import EmailPreviewDialog from "../../components/EmailPreviewDialog"

const defaultForm = {
  policyId: "", clientId: "", amount: "", paymentMethod: "TRANSFERENCIA",
  paymentDate: new Date().toISOString().split("T")[0], dueDate: "", receiptNumber: "", notes: ""
}

interface PolicyBalance {
  policyId: number
  policyNumber: string
  pendingAmount: number
  overdueAmount: number
  pendingPayments: number
  overduePayments: number
}

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("")
  const crud = useCrudModule<Payment>({
    endpoint: `/payments${statusFilter ? `?status=${statusFilter}` : ""}`,
    defaultForm
  })
  const [policies, setPolicies] = useState<Policy[]>([])
  const [clientBalance, setClientBalance] = useState<{ pending: number; completed: number; total: number } | null>(null)
  const [policyBalances, setPolicyBalances] = useState<PolicyBalance[]>([])
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [currentPaymentForEmail, setCurrentPaymentForEmail] = useState<number | null>(null)

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

  const handlePolicyChange = async (policyId: string) => {
    crud.updateField("policyId", policyId)
    const policy = policies.find(p => p.id === Number(policyId))
    if (policy) {
      crud.updateField("clientId", String(policy.clientId))

      // Fetch client balance
      try {
        const clientResp = await api.get<{ success: boolean; data: any }>(`/clients/${policy.clientId}`)
        if (clientResp.data.balance) {
          setClientBalance(clientResp.data.balance)
        }
      } catch (error) {
        console.error('Error fetching client balance:', error)
      }

      // Fetch all pending payments for client's policies
      try {
        const paymentsResp = await api.get<{ success: boolean; data: Payment[] }>(`/payments?clientId=${policy.clientId}&status=PENDIENTE&limit=500`)
        const pendingPayments = paymentsResp.data || []

        // Group by policy and calculate balances
        const balanceMap = new Map<number, PolicyBalance>()
        const today = new Date()

        for (const payment of pendingPayments) {
          if (!payment.policyId) continue

          const existing = balanceMap.get(payment.policyId) || {
            policyId: payment.policyId,
            policyNumber: payment.policy?.policyNumber || "",
            pendingAmount: 0,
            overdueAmount: 0,
            pendingPayments: 0,
            overduePayments: 0
          }

          const amount = Number(payment.amount)
          const isOverdue = payment.dueDate && new Date(payment.dueDate) < today

          existing.pendingAmount += amount
          existing.pendingPayments += 1

          if (isOverdue) {
            existing.overdueAmount += amount
            existing.overduePayments += 1
          }

          balanceMap.set(payment.policyId, existing)
        }

        setPolicyBalances(Array.from(balanceMap.values()))
      } catch (error) {
        console.error('Error fetching policy balances:', error)
        setPolicyBalances([])
      }
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

  const handleCloseModal = () => {
    crud.closeModal()
    setPolicyBalances([])
    setClientBalance(null)
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

  const handlePrintPDF = async (id: number) => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/payments/${id}/pdf`, {
        headers,
      })
      if (!response.ok) throw new Error('Error al generar PDF')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `recibo-${id}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
      crud.setSuccess('PDF generado exitosamente')
    } catch (error) {
      crud.setError('Error al generar PDF')
    }
  }

  const handleOpenEmailDialog = (id: number) => {
    setCurrentPaymentForEmail(id)
    setEmailDialogOpen(true)
  }

  const handleCompletePayment = async (payment: Payment) => {
    try {
      crud.setError("")
      crud.setSuccess("")
      await api.put(`/payments/${payment.id}`, {
        status: "COMPLETADO",
        paymentDate: new Date().toISOString().split("T")[0]
      })
      crud.setSuccess(`Pago de ${fmt(payment.amount)} completado exitosamente`)
      crud.fetchItems()
      crud.closeModal()
    } catch (error: any) {
      crud.setError(error.message || "Error al completar el pago")
    }
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
        onView={crud.openView} onEdit={handleEdit} onDelete={crud.askDelete}
        getRowClassName={(payment: Payment) => {
          const today = new Date()
          const dueDate = payment.dueDate ? new Date(payment.dueDate) : null

          if (payment.status === 'VENCIDO' || (payment.status === 'PENDIENTE' && dueDate && dueDate < today)) {
            return "bg-red-500/10 hover:bg-red-500/20 border-l-4 border-red-500/50"
          }
          if (payment.status === 'PENDIENTE') {
            return "bg-amber-500/10 hover:bg-amber-500/20 border-l-4 border-amber-500/50"
          }
          return ""
        }} />

      <Modal isOpen={crud.modal === "view"} onClose={crud.closeModal} title="Detalle del Pago" size="md">
        {crud.selected && (
          <div className="space-y-4 text-sm">
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

            <div className="pt-4 border-t border-slate-700">
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => handlePrintPDF(crud.selected!.id)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm flex items-center gap-2 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Recibo
                </button>
                <button
                  onClick={() => handleOpenEmailDialog(crud.selected!.id)}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm flex items-center gap-2 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Enviar Email
                </button>
              </div>

              {crud.selected.status === "PENDIENTE" && (
                <button
                  onClick={() => handleCompletePayment(crud.selected!)}
                  className="w-full px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard size={16} />
                  <span>Realizar Pago</span>
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={crud.modal === "create" || crud.modal === "edit"} onClose={handleCloseModal}
        title={crud.modal === "create" ? "Registrar Pago" : "Editar Pago"} size="lg">
        {crud.modal === "create" && policyBalances.length > 0 && (
          <div className="mb-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600/50">
            <p className="text-sm text-slate-300 font-medium mb-3">Deudas por Póliza:</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {policyBalances.map((pb) => (
                <div
                  key={pb.policyId}
                  onClick={() => handlePolicyChange(String(pb.policyId))}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    Number(crud.form.policyId) === pb.policyId
                      ? "bg-teal-600/20 border border-teal-500/50"
                      : "bg-slate-800/50 hover:bg-slate-800 border border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-200">{pb.policyNumber}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {pb.pendingPayments} cuota{pb.pendingPayments !== 1 ? "s" : ""} pendiente{pb.pendingPayments !== 1 ? "s" : ""}
                        {pb.overduePayments > 0 && (
                          <span className="text-red-400 ml-2">
                            ({pb.overduePayments} vencida{pb.overduePayments !== 1 ? "s" : ""})
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-base font-bold text-amber-400">{fmt(pb.pendingAmount)}</p>
                      {pb.overdueAmount > 0 && (
                        <p className="text-xs text-red-400 mt-0.5">{fmt(pb.overdueAmount)} vencido</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {clientBalance && (
              <div className="mt-3 pt-3 border-t border-slate-600 flex justify-between items-center">
                <span className="text-xs text-slate-400">Total Pendiente del Cliente:</span>
                <span className="text-sm font-bold text-red-400">{fmt(clientBalance.pending)}</span>
              </div>
            )}
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
          <button onClick={handleCloseModal} className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors">Cancelar</button>
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

      <EmailPreviewDialog
        isOpen={emailDialogOpen}
        onClose={() => {
          setEmailDialogOpen(false)
          setCurrentPaymentForEmail(null)
        }}
        previewEndpoint={`/payments/${currentPaymentForEmail}/email/preview`}
        sendEndpoint={`/payments/${currentPaymentForEmail}/email`}
        title="Preview y Envío de Email - Recibo de Pago"
      />
    </div>
  )
}
