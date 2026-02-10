import { useState, useEffect } from "react"
import { Shield, AlertTriangle, Calendar, X, Clock, FileText, Mail } from "lucide-react"
import { api } from "../../api/client"
import type { Client, Policy } from "../../types"
import { fmt, fmtDate } from "../../utils/format"
import StatusBadge from "../../components/ui/StatusBadge"
import EmailPreviewDialog from "../../components/EmailPreviewDialog"

interface ClientDetailModalProps {
  clientId: number
  onClose: () => void
}

interface ClientDetail extends Client {
  policies?: Policy[]
  balance?: number
}

export default function ClientDetailModal({ clientId, onClose }: ClientDetailModalProps) {
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)

  useEffect(() => {
    api.get<{ success: boolean; data: ClientDetail }>(`/clients/${clientId}`)
      .then(r => {
        setClient(r.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [clientId])

  const handleDownloadPDF = () => {
    window.open(`${import.meta.env.VITE_API_URL}/clients/${clientId}/pdf`, '_blank')
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 max-w-6xl w-full">
          <div className="text-center text-slate-400">Cargando...</div>
        </div>
      </div>
    )
  }

  if (!client) {
    return null
  }

  const activePolicies = client.policies?.filter(p => p.status === "VIGENTE") || []
  const inactivePolicies = client.policies?.filter(p => p.status !== "VIGENTE") || []
  
  // Calculate policies expiring soon (within 30 days)
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const expiringSoon = activePolicies.filter(p => {
    const endDate = new Date(p.endDate)
    return endDate >= now && endDate <= thirtyDaysFromNow
  })

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 max-w-6xl w-full my-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{client.name}</h2>
            <p className="text-slate-400 text-sm">{client.cedulaRnc}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Client Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-slate-400 text-xs mb-1">Estado</p>
            <StatusBadge status={client.status} />
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-slate-400 text-xs mb-1">Tipo</p>
            <p className="text-white">{client.type === "FISICA" ? "Persona Física" : "Jurídica"}</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-slate-400 text-xs mb-1">Balance</p>
            <p className="text-white font-semibold">{fmt(client.balance || 0)}</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 mb-6">
          <h3 className="text-sm font-semibold text-white mb-3">Información de Contacto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-400">Teléfono:</span> <span className="text-white ml-2">{client.phone || "—"}</span></div>
            <div><span className="text-slate-400">Email:</span> <span className="text-white ml-2">{client.email || "—"}</span></div>
            <div><span className="text-slate-400">Ciudad:</span> <span className="text-white ml-2">{client.city || "—"}</span></div>
            <div><span className="text-slate-400">Provincia:</span> <span className="text-white ml-2">{client.province || "—"}</span></div>
            <div className="md:col-span-2"><span className="text-slate-400">Dirección:</span> <span className="text-white ml-2">{client.address || "—"}</span></div>
          </div>
        </div>

        {/* Expiring Policies Alert */}
        {expiringSoon.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-amber-400 font-semibold text-sm mb-2">Pólizas Próximas a Vencer</h4>
                <div className="space-y-2">
                  {expiringSoon.map(policy => {
                    const daysLeft = Math.ceil((new Date(policy.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    return (
                      <div key={policy.id} className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
                        <div>
                          <p className="text-white text-sm font-medium">{policy.policyNumber}</p>
                          <p className="text-slate-400 text-xs">{policy.insurer?.name} · {policy.insuranceType?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-amber-400 text-sm font-semibold">{daysLeft} días</p>
                          <p className="text-slate-400 text-xs">{fmtDate(policy.endDate)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Policies Section */}
        <div className="space-y-6">
          {/* Active Policies */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={18} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Pólizas Activas ({activePolicies.length})</h3>
            </div>
            {activePolicies.length === 0 ? (
              <p className="text-slate-500 text-sm">No hay pólizas activas</p>
            ) : (
              <div className="space-y-2">
                {activePolicies.map(policy => (
                  <div key={policy.id} className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-white font-semibold">{policy.policyNumber}</p>
                          <StatusBadge status={policy.status} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          <div><span className="text-slate-400">Aseguradora:</span> <span className="text-white ml-2">{policy.insurer?.name}</span></div>
                          <div><span className="text-slate-400">Ramo:</span> <span className="text-white ml-2">{policy.insuranceType?.name}</span></div>
                          <div><span className="text-slate-400">Prima:</span> <span className="text-white ml-2">{fmt(policy.premium)}</span></div>
                          <div><span className="text-slate-400">Método Pago:</span> <span className="text-white ml-2">{policy.paymentMethod}</span></div>
                          <div className="flex items-center gap-1">
                            <Calendar size={14} className="text-slate-400" />
                            <span className="text-slate-400 text-xs">Inicio:</span>
                            <span className="text-white text-xs ml-1">{fmtDate(policy.startDate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} className="text-slate-400" />
                            <span className="text-slate-400 text-xs">Vencimiento:</span>
                            <span className="text-white text-xs ml-1">{fmtDate(policy.endDate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inactive Policies */}
          {inactivePolicies.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield size={18} className="text-slate-500" />
                <h3 className="text-sm font-semibold text-white">Pólizas Inactivas ({inactivePolicies.length})</h3>
              </div>
              <div className="space-y-2">
                {inactivePolicies.map(policy => (
                  <div key={policy.id} className="bg-slate-900/30 rounded-xl p-4 border border-slate-700/30 opacity-75">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-slate-300 font-semibold">{policy.policyNumber}</p>
                          <StatusBadge status={policy.status} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          <div><span className="text-slate-500">Aseguradora:</span> <span className="text-slate-300 ml-2">{policy.insurer?.name}</span></div>
                          <div><span className="text-slate-500">Ramo:</span> <span className="text-slate-300 ml-2">{policy.insuranceType?.name}</span></div>
                          <div><span className="text-slate-500">Prima:</span> <span className="text-slate-300 ml-2">{fmt(policy.premium)}</span></div>
                          <div><span className="text-slate-500">Vencimiento:</span> <span className="text-slate-300 ml-2">{fmtDate(policy.endDate)}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-6">
          <div className="flex gap-3">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors"
            >
              <FileText size={16} />
              Descargar PDF
            </button>
            <button
              onClick={() => setEmailDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm transition-colors"
            >
              <Mail size={16} />
              Enviar Email
            </button>
          </div>
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors">
            Cerrar
          </button>
        </div>

        {/* Email Preview Dialog */}
        <EmailPreviewDialog
          isOpen={emailDialogOpen}
          onClose={() => setEmailDialogOpen(false)}
          previewEndpoint={`/clients/${clientId}/email/preview`}
          sendEndpoint={`/clients/${clientId}/email`}
          title="Preview y Envío de Email - Cliente"
        />
      </div>
    </div>
  )
}
