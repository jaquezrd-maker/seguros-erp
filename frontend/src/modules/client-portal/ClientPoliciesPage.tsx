import { useState, useEffect } from "react"
import { Shield, Download, Eye, X } from "lucide-react"
import { api } from "../../api/client"
import { fmtDate, fmt } from "../../utils/format"
import StatusBadge from "../../components/ui/StatusBadge"
import Modal from "../../components/ui/Modal"
import { supabase } from "../../lib/supabase"

interface Policy {
  id: number
  policyNumber: string
  startDate: string
  endDate: string
  premium: number
  paymentMethod: string
  numberOfInstallments: number | null
  status: string
  autoRenew: boolean
  notes: string | null
  createdAt: string
  insurer: {
    id: number
    name: string
    phone: string | null
    email: string | null
  }
  insuranceType: {
    id: number
    name: string
    category: string | null
  }
  endorsements?: Array<{
    id: number
    type: string
    description: string | null
    effectiveDate: string
    premiumChange: number | null
  }>
}

export default function ClientPoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const queryParams = filter !== "all" ? `?status=${filter}` : ""
        const response = await api.get<{ success: boolean; data: Policy[] }>(`/client-portal-data/policies${queryParams}`)
        setPolicies(response.data)
      } catch (error) {
        console.error('Error fetching policies:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPolicies()
  }, [filter])

  const handleDownloadPDF = async (policyId: number, policyNumber: string) => {
    setDownloadingId(policyId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${import.meta.env.VITE_API_URL}/client-portal-data/policies/${policyId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`
        }
      })

      if (!response.ok) throw new Error('Error descargando PDF')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `poliza-${policyNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Error al descargar el PDF. Por favor intenta de nuevo.')
    } finally {
      setDownloadingId(null)
    }
  }

  const filteredPolicies = policies.filter(policy => {
    if (filter === "all") return true
    return policy.status === filter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Cargando pólizas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Mis Pólizas</h1>
        <p className="text-slate-400">Consulta todas tus pólizas de seguro</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-teal-500/15 text-teal-400 border border-teal-500/30"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          Todas ({policies.length})
        </button>
        <button
          onClick={() => setFilter("VIGENTE")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            filter === "VIGENTE"
              ? "bg-teal-500/15 text-teal-400 border border-teal-500/30"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          Vigentes ({policies.filter(p => p.status === "VIGENTE").length})
        </button>
        <button
          onClick={() => setFilter("VENCIDA")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            filter === "VENCIDA"
              ? "bg-teal-500/15 text-teal-400 border border-teal-500/30"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          Vencidas ({policies.filter(p => p.status === "VENCIDA").length})
        </button>
        <button
          onClick={() => setFilter("CANCELADA")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            filter === "CANCELADA"
              ? "bg-teal-500/15 text-teal-400 border border-teal-500/30"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          Canceladas ({policies.filter(p => p.status === "CANCELADA").length})
        </button>
      </div>

      {/* Grid de pólizas */}
      {filteredPolicies.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-12">
          <div className="text-center">
            <Shield size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg mb-2">No hay pólizas</p>
            <p className="text-slate-500 text-sm">
              {filter === "all"
                ? "No tienes pólizas registradas"
                : `No tienes pólizas ${filter.toLowerCase()}`}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPolicies.map((policy) => (
            <div
              key={policy.id}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                    <Shield size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold mb-1 truncate">
                      {policy.policyNumber}
                    </h3>
                    <p className="text-sm text-slate-400 truncate">
                      {policy.insuranceType.name}
                    </p>
                  </div>
                </div>
                <StatusBadge status={policy.status} />
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Aseguradora</span>
                  <span className="text-white font-medium">{policy.insurer.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Prima</span>
                  <span className="text-white font-semibold">{fmt(policy.premium)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Vigencia</span>
                  <span className="text-white">{fmtDate(policy.startDate)} - {fmtDate(policy.endDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Pago</span>
                  <span className="text-white">{policy.paymentMethod}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-700">
                <button
                  onClick={() => setSelectedPolicy(policy)}
                  className="flex-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  Ver Detalles
                </button>
                <button
                  onClick={() => handleDownloadPDF(policy.id, policy.policyNumber)}
                  disabled={downloadingId === policy.id}
                  className="flex-1 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {downloadingId === policy.id ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Descargando...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Descargar PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de detalles */}
      {selectedPolicy && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPolicy(null)}
          title="Detalles de la Póliza"
          size="lg"
        >
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">
                  {selectedPolicy.policyNumber}
                </h3>
                <p className="text-slate-400">{selectedPolicy.insuranceType.name}</p>
              </div>
              <StatusBadge status={selectedPolicy.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-400 mb-1">Aseguradora</p>
                <p className="text-white font-medium">{selectedPolicy.insurer.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Categoría</p>
                <p className="text-white font-medium">{selectedPolicy.insuranceType.category || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Prima</p>
                <p className="text-white font-semibold text-lg">{fmt(selectedPolicy.premium)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Método de Pago</p>
                <p className="text-white font-medium">{selectedPolicy.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Fecha de Inicio</p>
                <p className="text-white font-medium">{fmtDate(selectedPolicy.startDate)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Fecha de Vencimiento</p>
                <p className="text-white font-medium">{fmtDate(selectedPolicy.endDate)}</p>
              </div>
              {selectedPolicy.numberOfInstallments && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Cuotas</p>
                  <p className="text-white font-medium">{selectedPolicy.numberOfInstallments}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-slate-400 mb-1">Renovación Automática</p>
                <p className="text-white font-medium">{selectedPolicy.autoRenew ? "Sí" : "No"}</p>
              </div>
            </div>

            {selectedPolicy.notes && (
              <div>
                <p className="text-sm text-slate-400 mb-2">Notas</p>
                <p className="text-white bg-slate-800 p-3 rounded-lg text-sm">{selectedPolicy.notes}</p>
              </div>
            )}

            {selectedPolicy.endorsements && selectedPolicy.endorsements.length > 0 && (
              <div>
                <p className="text-sm text-slate-400 mb-3">Endosos</p>
                <div className="space-y-2">
                  {selectedPolicy.endorsements.map((endorsement) => (
                    <div key={endorsement.id} className="bg-slate-800 p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-white font-medium text-sm">{endorsement.type}</p>
                        <p className="text-xs text-slate-400">{fmtDate(endorsement.effectiveDate)}</p>
                      </div>
                      {endorsement.description && (
                        <p className="text-sm text-slate-400">{endorsement.description}</p>
                      )}
                      {endorsement.premiumChange && (
                        <p className="text-sm text-teal-400 mt-1">
                          Cambio en prima: {fmt(endorsement.premiumChange)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-500">
                Registrado el {fmtDate(selectedPolicy.createdAt)}
              </p>
              <button
                onClick={() => handleDownloadPDF(selectedPolicy.id, selectedPolicy.policyNumber)}
                disabled={downloadingId === selectedPolicy.id}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Download size={16} />
                {downloadingId === selectedPolicy.id ? "Descargando..." : "Descargar PDF"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
