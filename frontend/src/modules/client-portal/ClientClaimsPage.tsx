import { useState, useEffect } from "react"
import { AlertTriangle, Plus, Eye, X } from "lucide-react"
import { api } from "../../api/client"
import { fmtDate, fmt } from "../../utils/format"
import StatusBadge from "../../components/ui/StatusBadge"
import Modal from "../../components/ui/Modal"
import FormInput from "../../components/ui/FormInput"

interface Claim {
  id: number
  claimNumber: string
  type: string
  dateOccurred: string
  dateReported: string
  description: string
  estimatedAmount: number | null
  approvedAmount: number | null
  status: string
  priority: string
  createdAt: string
  policy: {
    id: number
    policyNumber: string
    insurer: { name: string }
  }
}

interface Policy {
  id: number
  policyNumber: string
  status: string
  insurer: { name: string }
  insuranceType: { name: string }
}

export default function ClientClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    policyId: "",
    type: "",
    dateOccurred: "",
    description: "",
    estimatedAmount: ""
  })

  useEffect(() => {
    fetchClaims()
    fetchPolicies()
  }, [])

  const fetchClaims = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Claim[] }>('/client-portal-data/claims')
      setClaims(response.data)
    } catch (error) {
      console.error('Error fetching claims:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPolicies = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Policy[] }>('/client-portal-data/policies?status=VIGENTE')
      setPolicies(response.data)
    } catch (error) {
      console.error('Error fetching policies:', error)
    }
  }

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.policyId || !formData.type || !formData.dateOccurred || !formData.description) {
      setError("Todos los campos marcados con * son obligatorios")
      return
    }

    if (formData.description.length < 10) {
      setError("La descripción debe tener al menos 10 caracteres")
      return
    }

    setSaving(true)

    try {
      const payload: any = {
        policyId: Number(formData.policyId),
        type: formData.type,
        dateOccurred: formData.dateOccurred,
        description: formData.description
      }

      if (formData.estimatedAmount) {
        payload.estimatedAmount = Number(formData.estimatedAmount)
      }

      const response = await api.post<{ success: boolean; data: Claim }>('/client-portal-data/claims', payload)

      // Mostrar número de reclamo generado
      alert(`Reclamo creado exitosamente.\n\nNúmero de reclamo: ${response.data.claimNumber}\n\nNuestro equipo lo revisará y te contactará pronto.`)

      // Refrescar lista
      await fetchClaims()

      // Cerrar modal y limpiar form
      setShowCreateModal(false)
      setFormData({
        policyId: "",
        type: "",
        dateOccurred: "",
        description: "",
        estimatedAmount: ""
      })
    } catch (error: any) {
      console.error('Error creating claim:', error)
      setError(error.message || "Error creando el reclamo. Por favor intenta de nuevo.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Cargando reclamos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Mis Reclamos</h1>
          <p className="text-slate-400">Consulta y reporta siniestros de tus pólizas</p>
        </div>
        {policies.length > 0 && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            Reportar Reclamo
          </button>
        )}
      </div>

      {/* Lista de reclamos */}
      {claims.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-12">
          <div className="text-center">
            <AlertTriangle size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg mb-2">No hay reclamos registrados</p>
            <p className="text-slate-500 text-sm mb-6">
              {policies.length === 0
                ? "No tienes pólizas vigentes para reportar reclamos"
                : "Cuando ocurra un siniestro, puedes reportarlo aquí"}
            </p>
            {policies.length > 0 && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors inline-flex items-center gap-2"
              >
                <Plus size={18} />
                Reportar Primer Reclamo
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 hover:border-slate-600 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="text-white font-semibold mb-1">{claim.claimNumber}</h3>
                          <p className="text-sm text-slate-400">{claim.type}</p>
                        </div>
                        <div className="flex gap-2">
                          <StatusBadge status={claim.status} />
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                            claim.priority === 'CRITICA' ? 'bg-red-500/15 text-red-400' :
                            claim.priority === 'ALTA' ? 'bg-orange-500/15 text-orange-400' :
                            claim.priority === 'MEDIA' ? 'bg-amber-500/15 text-amber-400' :
                            'bg-slate-700/50 text-slate-400'
                          }`}>
                            {claim.priority}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Póliza</p>
                          <p className="text-sm text-white font-medium">{claim.policy.policyNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Aseguradora</p>
                          <p className="text-sm text-white font-medium">{claim.policy.insurer.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Fecha del Incidente</p>
                          <p className="text-sm text-white font-medium">{fmtDate(claim.dateOccurred)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Reportado</p>
                          <p className="text-sm text-white font-medium">{fmtDate(claim.dateReported)}</p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="text-sm text-slate-300 line-clamp-2">{claim.description}</p>
                      </div>

                      {(claim.estimatedAmount || claim.approvedAmount) && (
                        <div className="mt-3 flex gap-4">
                          {claim.estimatedAmount && (
                            <div>
                              <p className="text-xs text-slate-500">Monto Estimado</p>
                              <p className="text-sm text-white font-semibold">{fmt(claim.estimatedAmount)}</p>
                            </div>
                          )}
                          {claim.approvedAmount && (
                            <div>
                              <p className="text-xs text-slate-500">Monto Aprobado</p>
                              <p className="text-sm text-emerald-400 font-semibold">{fmt(claim.approvedAmount)}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setSelectedClaim(claim)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Eye size={16} />
                      Ver Detalles
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de crear reclamo */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setError("")
          setFormData({
            policyId: "",
            type: "",
            dateOccurred: "",
            description: "",
            estimatedAmount: ""
          })
        }}
        title="Reportar Nuevo Reclamo"
        size="lg"
      >
        <form onSubmit={handleCreateClaim} className="space-y-4">
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <p className="text-sm text-amber-400">
              <strong>Importante:</strong> Reporta el siniestro lo antes posible. Nuestro equipo revisará tu caso y te contactará para el seguimiento.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <FormInput
            label="Póliza *"
            type="select"
            value={formData.policyId}
            onChange={(v) => setFormData({ ...formData, policyId: v })}
            required
            options={[
              { value: "", label: "Selecciona una póliza..." },
              ...policies.map(p => ({
                value: String(p.id),
                label: `${p.policyNumber} - ${p.insuranceType.name} (${p.insurer.name})`
              }))
            ]}
          />

          <FormInput
            label="Tipo de Siniestro *"
            value={formData.type}
            onChange={(v) => setFormData({ ...formData, type: v })}
            required
            placeholder="Ej: Robo, Accidente, Daño, etc."
          />

          <FormInput
            label="Fecha del Incidente *"
            type="date"
            value={formData.dateOccurred}
            onChange={(v) => setFormData({ ...formData, dateOccurred: v })}
            required
          />

          <FormInput
            label="Descripción Detallada *"
            type="textarea"
            value={formData.description}
            onChange={(v) => setFormData({ ...formData, description: v })}
            required
            placeholder="Describe detalladamente lo ocurrido: qué pasó, dónde, cómo, daños identificados, etc. (mínimo 10 caracteres)"
          />

          <FormInput
            label="Monto Estimado (Opcional)"
            type="number"
            value={formData.estimatedAmount}
            onChange={(v) => setFormData({ ...formData, estimatedAmount: v })}
            placeholder="0.00"
          />

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false)
                setError("")
                setFormData({
                  policyId: "",
                  type: "",
                  dateOccurred: "",
                  description: "",
                  estimatedAmount: ""
                })
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Enviando..." : "Reportar Reclamo"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de detalles de reclamo */}
      {selectedClaim && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedClaim(null)}
          title="Detalles del Reclamo"
          size="lg"
        >
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">
                  {selectedClaim.claimNumber}
                </h3>
                <p className="text-slate-400">{selectedClaim.type}</p>
              </div>
              <div className="flex gap-2">
                <StatusBadge status={selectedClaim.status} />
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                  selectedClaim.priority === 'CRITICA' ? 'bg-red-500/15 text-red-400' :
                  selectedClaim.priority === 'ALTA' ? 'bg-orange-500/15 text-orange-400' :
                  selectedClaim.priority === 'MEDIA' ? 'bg-amber-500/15 text-amber-400' :
                  'bg-slate-700/50 text-slate-400'
                }`}>
                  Prioridad: {selectedClaim.priority}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-400 mb-1">Póliza</p>
                <p className="text-white font-medium">{selectedClaim.policy.policyNumber}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Aseguradora</p>
                <p className="text-white font-medium">{selectedClaim.policy.insurer.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Fecha del Incidente</p>
                <p className="text-white font-medium">{fmtDate(selectedClaim.dateOccurred)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Fecha de Reporte</p>
                <p className="text-white font-medium">{fmtDate(selectedClaim.dateReported)}</p>
              </div>
              {selectedClaim.estimatedAmount && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Monto Estimado</p>
                  <p className="text-white font-semibold text-lg">{fmt(selectedClaim.estimatedAmount)}</p>
                </div>
              )}
              {selectedClaim.approvedAmount && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Monto Aprobado</p>
                  <p className="text-emerald-400 font-semibold text-lg">{fmt(selectedClaim.approvedAmount)}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-slate-400 mb-2">Descripción del Incidente</p>
              <p className="text-white bg-slate-800 p-4 rounded-lg">{selectedClaim.description}</p>
            </div>

            <div className="pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-500">
                Reclamo registrado el {fmtDate(selectedClaim.createdAt)}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
