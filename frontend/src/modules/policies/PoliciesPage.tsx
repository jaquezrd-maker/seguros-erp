import { useState, useEffect } from "react"
import { Shield, CheckCircle, Clock, Printer, Mail } from "lucide-react"
import useCrudModule from "../../hooks/useCrudModule"
import { api, getAuthHeaders } from "../../api/client"
import type { Policy, Client, Insurer, InsuranceType, ApiResponse, PaginatedResponse, BeneficiaryData } from "../../types"
import { fmt, fmtDate, toDateInput } from "../../utils/format"
import StatusBadge from "../../components/ui/StatusBadge"
import DataTable from "../../components/ui/DataTable"
import SearchBar from "../../components/ui/SearchBar"
import StatCard from "../../components/ui/StatCard"
import Modal from "../../components/ui/Modal"
import FormInput from "../../components/ui/FormInput"
import ConfirmDialog from "../../components/ui/ConfirmDialog"
import EmailDialog from "../../components/ui/EmailDialog"
import PaymentPlanConfig from "./PaymentPlanConfig"
import BeneficiaryForm from "./BeneficiaryForm"

interface Payment {
  id: number
  amount: number
  paymentDate: string
  dueDate: string | null
  status: string
  receiptNumber: string | null
}

const defaultForm = {
  policyNumber: "", clientId: "", insurerId: "", insuranceTypeId: "",
  startDate: "", endDate: "", premium: "", paymentMethod: "MENSUAL", numberOfInstallments: 1, autoRenew: false, commissionRate: "", notes: ""
}

interface PaymentSchedule {
  month: number
  dueDate: string
  amount: number
}

export default function PoliciesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("")
  const crud = useCrudModule<Policy>({ 
    endpoint: `/policies${statusFilter ? `?status=${statusFilter}` : ""}`, 
    defaultForm 
  })
  const [clients, setClients] = useState<Client[]>([])
  const [insurers, setInsurers] = useState<Insurer[]>([])
  const [insuranceTypes, setInsuranceTypes] = useState<InsuranceType[]>([])
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentSchedule[]>([])
  const [policyPayments, setPolicyPayments] = useState<Payment[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<Policy | null>(null)
  const [beneficiaryData, setBeneficiaryData] = useState<BeneficiaryData | null>(null)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [currentPolicyForEmail, setCurrentPolicyForEmail] = useState<number | null>(null)

  useEffect(() => {
    api.get<PaginatedResponse<Client>>("/clients?limit=500").then(r => setClients(r.data)).catch((err) => {
      console.error("Error cargando clientes:", err)
    })
    api.get<PaginatedResponse<Insurer>>("/insurers?limit=500").then(r => setInsurers(r.data)).catch((err) => {
      console.error("Error cargando aseguradoras:", err)
    })
    api.get<ApiResponse<InsuranceType[]>>("/insurance-types").then(r => {
      console.log("Tipos de seguro cargados:", r.data)
      setInsuranceTypes(r.data)
    }).catch((err) => {
      console.error("Error cargando tipos de seguro:", err)
      crud.setError("No se pudieron cargar los tipos de seguro. Por favor, recargue la página.")
    })
  }, [])

  useEffect(() => {
    crud.fetchItems()
  }, [statusFilter])

  const columns = [
    { key: "policyNumber", label: "No. Póliza" },
    { key: "client", label: "Cliente", render: (_: any, row: Policy) => row.client?.name || "—" },
    { key: "insurer", label: "Aseguradora", render: (_: any, row: Policy) => row.insurer?.name || "—" },
    { key: "insuranceType", label: "Ramo", render: (_: any, row: Policy) => row.insuranceType?.name || "—" },
    {
      key: "beneficiary",
      label: "Bien Asegurado",
      render: (_: any, row: Policy) => {
        if (!row.beneficiaryData) return "—"
        const b = row.beneficiaryData

        if (b.type === 'vehicle') {
          return (
            <div className="text-xs">
              <div className="font-medium text-slate-200">{b.vehiclePlate || b.vehicleMake}</div>
              {b.vehicleModel && <div className="text-slate-500">{b.vehicleModel} {b.vehicleYear || ''}</div>}
            </div>
          )
        }

        if (b.type === 'person' || b.type === 'health') {
          return (
            <div className="text-xs">
              <div className="font-medium text-slate-200">{b.personName || '—'}</div>
              {b.personCedula && <div className="text-slate-500">{b.personCedula}</div>}
            </div>
          )
        }

        if (b.type === 'property') {
          return (
            <div className="text-xs">
              <div className="font-medium text-slate-200">{b.propertyType || 'Propiedad'}</div>
              {b.propertyAddress && <div className="text-slate-500 truncate max-w-[200px]">{b.propertyAddress}</div>}
            </div>
          )
        }

        return "—"
      }
    },
    { key: "premium", label: "Prima", render: (v: number) => fmt(v) },
    { key: "endDate", label: "Vencimiento", render: (v: string) => fmtDate(v) },
    { key: "status", label: "Estado", render: (v: string) => <StatusBadge status={v} /> },
  ]

  const handleEdit = (item: Policy) => {
    crud.openEdit(item)
    crud.setForm((prev: Record<string, any>) => ({
      ...prev,
      startDate: toDateInput(item.startDate),
      endDate: toDateInput(item.endDate),
      numberOfInstallments: item.numberOfInstallments || 1,
    }))
    // Cargar datos del beneficiario si existen
    if (item.beneficiaryData) {
      setBeneficiaryData(item.beneficiaryData)
    } else {
      setBeneficiaryData(null)
    }
    // Cargar pagos de la póliza para validar cambio de método de pago
    setLoadingPayments(true)
    api.get<PaginatedResponse<Payment>>(`/payments?policyId=${item.id}&limit=100`)
      .then(r => setPolicyPayments(r.data.filter(p => p.status === 'PENDIENTE' || p.status === 'COMPLETADO')))
      .catch(() => setPolicyPayments([]))
      .finally(() => setLoadingPayments(false))
  }

  const handleSave = async () => {
    const data = {
      ...crud.form,
      clientId: Number(crud.form.clientId),
      insurerId: Number(crud.form.insurerId),
      insuranceTypeId: Number(crud.form.insuranceTypeId),
      premium: Number(crud.form.premium),
      numberOfInstallments: Number(crud.form.numberOfInstallments),
      commissionRate: crud.form.commissionRate ? Number(crud.form.commissionRate) : null,
      beneficiaryData: beneficiaryData || undefined,
      paymentSchedule: paymentSchedule.length > 0 ? paymentSchedule : undefined,
    }
    if (crud.modal === "create") await crud.createItem(data)
    else if (crud.modal === "edit" && crud.selected) await crud.updateItem(crud.selected.id, data)
  }

  const handleCancel = async (policy: Policy) => {
    try {
      await crud.patchItem(policy.id, "status", { status: "CANCELADA" })

      // Recargar la póliza para mostrar el botón de eliminar permanentemente
      const updatedPolicy = await api.get<{ success: boolean; data: Policy }>(`/policies/${policy.id}`)
      if (updatedPolicy.success) {
        // Actualizar el estado seleccionado para reflejar el cambio
        crud.openView(updatedPolicy.data)
        crud.setSuccess(`Póliza ${policy.policyNumber} cancelada. Ahora puede eliminarla permanentemente si lo desea.`)
      }
    } catch (error) {
      console.error("Error al cancelar póliza:", error)
      crud.setError("Error al cancelar la póliza")
    }
  }

  const handleReactivate = async (policy: Policy) => {
    try {
      const response = await api.post<{ success: boolean; data: Policy; message: string }>(`/policies/${policy.id}/reactivate`, {})
      if (response.success) {
        // Recargar la póliza para mostrar el estado actualizado
        const updatedPolicy = await api.get<{ success: boolean; data: Policy }>(`/policies/${policy.id}`)
        if (updatedPolicy.success) {
          crud.openView(updatedPolicy.data)
          crud.setSuccess(response.message || `Póliza ${policy.policyNumber} reactivada exitosamente`)
          crud.fetchItems() // Recargar la lista
        }
      }
    } catch (error: any) {
      console.error("Error al reactivar póliza:", error)
      crud.setError(error.response?.data?.message || "Error al reactivar la póliza")
    }
  }

  const handlePrintPDF = async (id: number) => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/policies/${id}/pdf`, {
        headers,
      })
      if (!response.ok) throw new Error('Error al generar PDF')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `poliza-${id}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
      crud.setSuccess('PDF generado exitosamente')
    } catch (error) {
      crud.setError('Error al generar PDF')
    }
  }

  const handleOpenEmailDialog = (id: number) => {
    setCurrentPolicyForEmail(id)
    setEmailDialogOpen(true)
  }

  const handleSendEmail = async (recipients: string[], includeAttachment: boolean) => {
    if (!currentPolicyForEmail) return
    await api.post(`/policies/${currentPolicyForEmail}/email`, { recipients, includeAttachment })
    crud.setSuccess('Email enviado exitosamente')
    setEmailDialogOpen(false)
    setCurrentPolicyForEmail(null)
  }

  const handleViewPolicy = async (policy: Policy) => {
    crud.openView(policy)
    setLoadingPayments(true)
    try {
      const res = await api.get<PaginatedResponse<Payment>>(`/payments?policyId=${policy.id}&limit=100`)
      setPolicyPayments(res.data || [])
    } catch (error) {
      console.error("Error al cargar pagos:", error)
      setPolicyPayments([])
    } finally {
      setLoadingPayments(false)
    }
  }

  const askPermanentDelete = (policy: Policy) => {
    setPermanentDeleteTarget(policy)
  }

  const cancelPermanentDelete = () => {
    setPermanentDeleteTarget(null)
  }

  const confirmPermanentDelete = async () => {
    if (!permanentDeleteTarget) return

    crud.setError("")
    crud.setSuccess("")
    try {
      const res = await api.delete<{ success: boolean; message: string }>(
        `/policies/${permanentDeleteTarget.id}/permanent`
      )

      if (res.success) {
        setPermanentDeleteTarget(null)
        crud.setSuccess(res.message)
        crud.fetchItems()
        crud.closeModal()
      }
    } catch (error: any) {
      crud.setError(error.message || "Error al eliminar póliza")
      setPermanentDeleteTarget(null)
    }
  }

  const vigentes = crud.summary?.vigenteCount ?? 0
  const totalPrima = crud.summary?.totalPremium ?? 0
  const vencidas = crud.summary?.vencidaCount ?? 0

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Pólizas" value={crud.total} icon={Shield} color="teal" />
        <StatCard title="Vigentes" value={vigentes} icon={Shield} color="emerald" />
        <StatCard title="Prima Total" value={fmt(totalPrima)} icon={Shield} color="indigo" />
        <StatCard title="Vencidas" value={vencidas} icon={Shield} color="red" />
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar value={crud.search} onChange={crud.setSearch} placeholder="Buscar póliza..." onAdd={crud.openNew} addLabel="Nueva Póliza" />
        </div>
        <div className="w-full sm:w-48">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Todos los estados</option>
            <option value="VIGENTE">Vigente</option>
            <option value="VENCIDA">Vencida</option>
            <option value="CANCELADA">Cancelada</option>
            <option value="EN_RENOVACION">En Renovación</option>
          </select>
        </div>
      </div>

      {crud.success && <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl p-3 mb-4 text-sm">{crud.success}</div>}
      {crud.error && <div className="bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl p-3 mb-4 text-sm">{crud.error}</div>}

      <DataTable columns={columns} data={crud.items} loading={crud.loading}
        onView={handleViewPolicy} onEdit={handleEdit} onDelete={crud.askDelete}
        getRowClassName={(policy: Policy) => {
          if (policy.hasOverduePayments) {
            return "bg-red-500/10 hover:bg-red-500/20 border-l-4 border-red-500/50"
          }
          if (policy.hasPendingPayments) {
            return "bg-amber-500/10 hover:bg-amber-500/20 border-l-4 border-amber-500/50"
          }
          return ""
        }} />

      <Modal isOpen={crud.modal === "view"} onClose={crud.closeModal} title="Detalle de Póliza" size="xl">
        {crud.selected && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-400">No. Póliza:</span> <span className="text-white ml-2">{crud.selected.policyNumber}</span></div>
              <div><span className="text-slate-400">Estado:</span> <span className="ml-2"><StatusBadge status={crud.selected.status} /></span></div>
              <div><span className="text-slate-400">Cliente:</span> <span className="text-white ml-2">{crud.selected.client?.name || "—"}</span></div>
              <div><span className="text-slate-400">Aseguradora:</span> <span className="text-white ml-2">{crud.selected.insurer?.name || "—"}</span></div>
              <div><span className="text-slate-400">Ramo:</span> <span className="text-white ml-2">{crud.selected.insuranceType?.name || "—"}</span></div>
              <div><span className="text-slate-400">Prima:</span> <span className="text-white ml-2">{fmt(crud.selected.premium)}</span></div>
              <div><span className="text-slate-400">Vigencia:</span> <span className="text-white ml-2">{fmtDate(crud.selected.startDate)} — {fmtDate(crud.selected.endDate)}</span></div>
              <div><span className="text-slate-400">Plan de Pago:</span> <span className="text-white ml-2">{crud.selected.numberOfInstallments ? `${crud.selected.numberOfInstallments} cuota${crud.selected.numberOfInstallments > 1 ? 's' : ''} mensual${crud.selected.numberOfInstallments > 1 ? 'es' : ''}` : crud.selected.paymentMethod}</span></div>
            </div>

            {crud.selected.beneficiaryData && (
              <div className="border-t border-slate-700 pt-6">
                <h3 className="text-base font-semibold text-white mb-4">Datos del Bien Asegurado</h3>
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {crud.selected.beneficiaryData.type === 'vehicle' && (
                      <>
                        {crud.selected.beneficiaryData.vehicleMake && <div><span className="text-slate-400">Marca:</span> <span className="text-white ml-2">{crud.selected.beneficiaryData.vehicleMake}</span></div>}
                        {crud.selected.beneficiaryData.vehicleModel && <div><span className="text-slate-400">Modelo:</span> <span className="text-white ml-2">{crud.selected.beneficiaryData.vehicleModel}</span></div>}
                        {crud.selected.beneficiaryData.vehicleYear && <div><span className="text-slate-400">Año:</span> <span className="text-white ml-2">{crud.selected.beneficiaryData.vehicleYear}</span></div>}
                        {crud.selected.beneficiaryData.vehiclePlate && <div><span className="text-slate-400">Placa:</span> <span className="text-white ml-2">{crud.selected.beneficiaryData.vehiclePlate}</span></div>}
                        {crud.selected.beneficiaryData.vehicleChasis && <div><span className="text-slate-400">Chasis:</span> <span className="text-white ml-2">{crud.selected.beneficiaryData.vehicleChasis}</span></div>}
                        {crud.selected.beneficiaryData.vehicleColor && <div><span className="text-slate-400">Color:</span> <span className="text-white ml-2">{crud.selected.beneficiaryData.vehicleColor}</span></div>}
                        {crud.selected.beneficiaryData.vehicleValue && <div><span className="text-slate-400">Valor:</span> <span className="text-white ml-2">{fmt(crud.selected.beneficiaryData.vehicleValue)}</span></div>}
                      </>
                    )}
                    {crud.selected.beneficiaryData.type === 'person' && (
                      <>
                        {crud.selected.beneficiaryData.personName && <div><span className="text-slate-400">Nombre:</span> <span className="text-white ml-2">{crud.selected.beneficiaryData.personName}</span></div>}
                        {crud.selected.beneficiaryData.personCedula && <div><span className="text-slate-400">Cédula:</span> <span className="text-white ml-2">{crud.selected.beneficiaryData.personCedula}</span></div>}
                        {crud.selected.beneficiaryData.personBirthDate && <div><span className="text-slate-400">Fecha de Nacimiento:</span> <span className="text-white ml-2">{fmtDate(crud.selected.beneficiaryData.personBirthDate)}</span></div>}
                        {crud.selected.beneficiaryData.personRelationship && <div><span className="text-slate-400">Parentesco:</span> <span className="text-white ml-2">{crud.selected.beneficiaryData.personRelationship}</span></div>}
                        {crud.selected.beneficiaryData.personPhone && <div><span className="text-slate-400">Teléfono:</span> <span className="text-white ml-2">{crud.selected.beneficiaryData.personPhone}</span></div>}
                      </>
                    )}
                    {crud.selected.beneficiaryData.type === 'property' && (
                      <>
                        {crud.selected.beneficiaryData.propertyAddress && <div className="col-span-2"><span className="text-slate-400">Dirección:</span> <span className="text-white ml-2">{crud.selected.beneficiaryData.propertyAddress}</span></div>}
                        {crud.selected.beneficiaryData.propertyType && <div><span className="text-slate-400">Tipo:</span> <span className="text-white ml-2">{crud.selected.beneficiaryData.propertyType}</span></div>}
                        {crud.selected.beneficiaryData.propertyValue && <div><span className="text-slate-400">Valor:</span> <span className="text-white ml-2">{fmt(crud.selected.beneficiaryData.propertyValue)}</span></div>}
                        {crud.selected.beneficiaryData.propertyDescription && <div className="col-span-2"><span className="text-slate-400">Descripción:</span> <span className="text-white ml-2">{crud.selected.beneficiaryData.propertyDescription}</span></div>}
                      </>
                    )}
                    {crud.selected.beneficiaryData.type === 'health' && (
                      <>
                        {crud.selected.beneficiaryData.personName && <div><span className="text-slate-400">Asegurado:</span> <span className="text-white ml-2">{crud.selected.beneficiaryData.personName}</span></div>}
                        {crud.selected.beneficiaryData.personBirthDate && <div><span className="text-slate-400">Fecha de Nacimiento:</span> <span className="text-white ml-2">{fmtDate(crud.selected.beneficiaryData.personBirthDate)}</span></div>}
                        {crud.selected.beneficiaryData.healthConditions && <div className="col-span-2"><span className="text-slate-400">Condiciones:</span> <span className="text-white ml-2">{crud.selected.beneficiaryData.healthConditions}</span></div>}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-slate-700 pt-6">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Historial de Pagos
              </h3>
              
              {loadingPayments ? (
                <div className="text-center py-8 text-slate-400">Cargando pagos...</div>
              ) : policyPayments.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No hay pagos registrados</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pagos Completados */}
                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                    <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Pagos Completados ({policyPayments.filter(p => p.status === 'COMPLETADO').length})
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {policyPayments.filter(p => p.status === 'COMPLETADO').length === 0 ? (
                        <p className="text-slate-500 text-xs">No hay pagos completados</p>
                      ) : (
                        policyPayments.filter(p => p.status === 'COMPLETADO').map(payment => (
                          <div key={payment.id} className="flex justify-between items-center py-2 border-b border-slate-700/30 last:border-0">
                            <div>
                              <p className="text-sm text-white">{fmt(payment.amount)}</p>
                              <p className="text-xs text-slate-500">Fecha: {fmtDate(payment.paymentDate)}</p>
                              {payment.receiptNumber && <p className="text-xs text-slate-500">Recibo: {payment.receiptNumber}</p>}
                            </div>
                            <StatusBadge status={payment.status} />
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Pagos Pendientes */}
                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                    <h4 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Pagos Pendientes ({policyPayments.filter(p => p.status === 'PENDIENTE').length})
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {policyPayments.filter(p => p.status === 'PENDIENTE').length === 0 ? (
                        <p className="text-slate-500 text-xs">No hay pagos pendientes</p>
                      ) : (
                        policyPayments.filter(p => p.status === 'PENDIENTE').map(payment => (
                          <div key={payment.id} className="flex justify-between items-center py-2 border-b border-slate-700/30 last:border-0">
                            <div>
                              <p className="text-sm text-white">{fmt(payment.amount)}</p>
                              {payment.dueDate && (
                                <p className="text-xs text-amber-400">Vence: {fmtDate(payment.dueDate)}</p>
                              )}
                            </div>
                            <StatusBadge status={payment.status} />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-700">
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => handlePrintPDF(crud.selected!.id)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm flex items-center gap-2 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir PDF
                </button>
                <button
                  onClick={() => handleOpenEmailDialog(crud.selected!.id)}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm flex items-center gap-2 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Enviar Email
                </button>
              </div>

              {crud.selected.status === "VIGENTE" && (
                <button onClick={() => handleCancel(crud.selected!)} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm transition-colors">
                  Cancelar Póliza
                </button>
              )}
            </div>

            {crud.selected.status === "CANCELADA" && (
              <div className="pt-4 border-t border-slate-700">
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
                  <p className="text-green-400 text-sm mb-2 font-semibold">🔄 Reactivar Póliza</p>
                  <p className="text-slate-400 text-xs mb-3">
                    Puedes reactivar esta póliza cancelada cambiando su estado a VIGENTE.
                  </p>
                  <button
                    onClick={() => handleReactivate(crud.selected!)}
                    className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors"
                  >
                    Reactivar Póliza
                  </button>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                  <p className="text-red-400 text-sm mb-2 font-semibold">⚠️ Zona de Peligro</p>
                  <p className="text-slate-400 text-xs mb-3">
                    La eliminación permanente borrará TODOS los registros relacionados (pagos, siniestros, comisiones, renovaciones, etc.). Esta acción NO se puede deshacer.
                  </p>
                  <button
                    onClick={() => askPermanentDelete(crud.selected!)}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
                  >
                    Eliminar Permanentemente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={crud.modal === "create" || crud.modal === "edit"} onClose={crud.closeModal}
        title={crud.modal === "create" ? "Nueva Póliza" : "Editar Póliza"} size="lg">
        {insuranceTypes.length === 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4">
            <p className="text-amber-400 text-sm">⚠️ No se han cargado los tipos de seguro. Intente recargar la página.</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label="No. Póliza" value={crud.form.policyNumber} onChange={v => crud.updateField("policyNumber", v)} required />
          <FormInput label="Cliente" type="select" value={crud.form.clientId} onChange={v => crud.updateField("clientId", v)} required
            options={clients.map(c => ({ value: c.id, label: c.name }))} />
          <FormInput label="Aseguradora" type="select" value={crud.form.insurerId} onChange={v => crud.updateField("insurerId", v)} required
            options={insurers.map(i => ({ value: i.id, label: i.name }))} />
          <FormInput label="Tipo de Seguro" type="select" value={crud.form.insuranceTypeId} onChange={v => crud.updateField("insuranceTypeId", v)} required
            options={insuranceTypes.map(t => ({ value: t.id, label: t.name }))} />
          <FormInput label="Fecha Inicio" type="date" value={crud.form.startDate} onChange={v => crud.updateField("startDate", v)} required />
          <FormInput label="Fecha Fin" type="date" value={crud.form.endDate} onChange={v => crud.updateField("endDate", v)} required />
          <FormInput label="Prima (DOP)" type="number" value={crud.form.premium} onChange={v => crud.updateField("premium", v)} required />
          <FormInput label="% Comisión (opcional)" type="number" value={crud.form.commissionRate || ""} onChange={v => crud.updateField("commissionRate", v)}
            placeholder="Dejar vacío para usar la regla por defecto" />
          <FormInput label="Número de Cuotas" type="select" value={crud.form.numberOfInstallments} onChange={v => crud.updateField("numberOfInstallments", v)} required
            options={[
              { value: 1, label: "1 cuota (Anual)" },
              { value: 2, label: "2 cuotas (Semestral)" },
              { value: 3, label: "3 cuotas (Trimestral)" },
              { value: 4, label: "4 cuotas" },
              { value: 5, label: "5 cuotas" },
              { value: 6, label: "6 cuotas (Mensual)" }
            ]}
            disabled={crud.modal === "edit" && policyPayments.length > 0} />
          {crud.modal === "edit" && policyPayments.length > 0 && (
            <div className="md:col-span-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
              <p className="text-amber-400 text-xs flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <span>Esta póliza tiene {policyPayments.length} pago(s) registrado(s). No se puede cambiar el número de cuotas a menos que anule los pagos primero.</span>
              </p>
            </div>
          )}
          <div className="md:col-span-2">
            <FormInput label="Notas" type="textarea" value={crud.form.notes} onChange={v => crud.updateField("notes", v)} />
          </div>
        </div>
        
        {crud.modal === "create" && crud.form.premium && crud.form.startDate && crud.form.numberOfInstallments && (
          <div className="mt-6 border-t border-slate-700 pt-6">
            <PaymentPlanConfig
              premium={Number(crud.form.premium)}
              numberOfInstallments={Number(crud.form.numberOfInstallments)}
              startDate={crud.form.startDate}
              onChange={setPaymentSchedule}
            />
          </div>
        )}

        {crud.form.insuranceTypeId && (
          <div className="mt-6 border-t border-slate-700 pt-6">
            <h3 className="text-sm font-semibold text-white mb-4">Datos del Bien Asegurado</h3>
            <BeneficiaryForm
              insuranceTypeName={insuranceTypes.find(t => t.id === Number(crud.form.insuranceTypeId))?.name || ""}
              value={beneficiaryData}
              onChange={setBeneficiaryData}
            />
          </div>
        )}

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
        title="Cancelar Póliza"
        message={`¿Está seguro de cancelar la póliza "${crud.deleteTarget?.policyNumber}"? La póliza se marcará como CANCELADA pero se mantendrá en el historial.`}
        onConfirm={crud.deleteItem}
        onCancel={crud.cancelDelete}
        loading={crud.saving}
      />

      <ConfirmDialog
        isOpen={!!permanentDeleteTarget}
        title="⚠️ ELIMINAR PERMANENTEMENTE"
        message={`¿Está COMPLETAMENTE SEGURO de eliminar permanentemente la póliza "${permanentDeleteTarget?.policyNumber}"?\n\nEsta acción eliminará:\n• Todos los pagos\n• Todos los siniestros\n• Todas las comisiones\n• Todas las renovaciones\n• Todos los documentos relacionados\n\n⚠️ ESTA ACCIÓN NO SE PUEDE DESHACER ⚠️`}
        onConfirm={confirmPermanentDelete}
        onCancel={cancelPermanentDelete}
        loading={crud.saving}
      />

      <EmailDialog
        isOpen={emailDialogOpen}
        onClose={() => {
          setEmailDialogOpen(false)
          setCurrentPolicyForEmail(null)
        }}
        onSend={handleSendEmail}
        recipientOptions={[
          { value: "client", label: "Cliente", description: "Enviar al email del cliente" },
          { value: "insurer", label: "Aseguradora", description: "Enviar a la aseguradora" },
          { value: "internal", label: "Interno", description: "Enviar a equipo interno" },
        ]}
        title="Enviar Póliza por Email"
        attachmentLabel="Adjuntar documento de póliza (PDF)"
      />
    </div>
  )
}
