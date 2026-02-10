import { useState, useEffect } from "react"
import { RefreshCw, Calendar, AlertCircle } from "lucide-react"
import { api } from "../../api/client"
import { fmtDate, fmt } from "../../utils/format"

interface Renewal {
  id: number
  originalEndDate: string
  newEndDate: string | null
  newPremium: number | null
  status: string
  createdAt: string
  policy: {
    id: number
    policyNumber: string
    premium: number
    insurer: { name: string }
    insuranceType: { name: string }
  }
}

export default function ClientRenewalsPage() {
  const [renewals, setRenewals] = useState<Renewal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRenewals = async () => {
      try {
        const response = await api.get<{ success: boolean; data: Renewal[] }>('/client-portal-data/renewals')
        setRenewals(response.data)
      } catch (error) {
        console.error('Error fetching renewals:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRenewals()
  }, [])

  const getDaysRemaining = (endDate: string) => {
    const today = new Date()
    const end = new Date(endDate)
    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getDaysColor = (days: number) => {
    if (days < 0) return "text-red-400"
    if (days <= 7) return "text-red-400"
    if (days <= 30) return "text-amber-400"
    return "text-emerald-400"
  }

  const getDaysBgColor = (days: number) => {
    if (days < 0) return "bg-red-500/10 border-red-500/30"
    if (days <= 7) return "bg-red-500/10 border-red-500/30"
    if (days <= 30) return "bg-amber-500/10 border-amber-500/30"
    return "bg-emerald-500/10 border-emerald-500/30"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Cargando renovaciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Renovaciones Pendientes</h1>
        <p className="text-slate-400">Gestiona las renovaciones de tus pólizas próximas a vencer</p>
      </div>

      {renewals.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-12">
          <div className="text-center">
            <RefreshCw size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg mb-2">No hay renovaciones pendientes</p>
            <p className="text-slate-500 text-sm">
              Todas tus pólizas están al día
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Alerta si hay renovaciones urgentes */}
          {renewals.some(r => getDaysRemaining(r.originalEndDate) <= 7) && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-400 mb-1">Renovaciones Urgentes</p>
                <p className="text-xs text-red-400/80">
                  Tienes pólizas que vencen en menos de 7 días. Contacta a tu ejecutivo para renovarlas.
                </p>
              </div>
            </div>
          )}

          {/* Lista de renovaciones */}
          <div className="space-y-4">
            {renewals.map((renewal) => {
              const daysRemaining = getDaysRemaining(renewal.originalEndDate)
              const isExpired = daysRemaining < 0

              return (
                <div
                  key={renewal.id}
                  className={`bg-slate-900 border rounded-2xl p-6 ${getDaysBgColor(daysRemaining)}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                          <RefreshCw size={20} className={getDaysColor(daysRemaining)} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-semibold mb-1">
                            {renewal.policy.policyNumber}
                          </h3>
                          <p className="text-sm text-slate-400">
                            {renewal.policy.insuranceType.name} - {renewal.policy.insurer.name}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 ml-13">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Fecha de Vencimiento</p>
                          <p className="text-sm text-white font-medium flex items-center gap-2">
                            <Calendar size={14} />
                            {fmtDate(renewal.originalEndDate)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500 mb-1">Prima Actual</p>
                          <p className="text-sm text-white font-medium">
                            {fmt(renewal.policy.premium)}
                          </p>
                        </div>

                        {renewal.newPremium && (
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Nueva Prima</p>
                            <p className="text-sm text-white font-medium">
                              {fmt(renewal.newPremium)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <div className={`px-4 py-3 rounded-xl border ${getDaysBgColor(daysRemaining)} text-center`}>
                        <p className={`text-2xl font-bold ${getDaysColor(daysRemaining)}`}>
                          {isExpired ? Math.abs(daysRemaining) : daysRemaining}
                        </p>
                        <p className={`text-xs font-medium ${getDaysColor(daysRemaining)}`}>
                          {isExpired
                            ? `día${Math.abs(daysRemaining) !== 1 ? 's' : ''} vencida`
                            : `día${daysRemaining !== 1 ? 's' : ''} restante${daysRemaining !== 1 ? 's' : ''}`
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {isExpired && (
                    <div className="mt-4 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                      <p className="text-xs text-red-400">
                        ⚠️ Esta póliza ya venció. Contacta urgentemente a tu ejecutivo para renovarla y evitar quedar sin cobertura.
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Información adicional */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-3">Información sobre Renovaciones</h3>
        <ul className="space-y-2 text-sm text-slate-400">
          <li className="flex items-start gap-2">
            <span className="text-teal-400 mt-1">•</span>
            <span>Las renovaciones se procesan automáticamente 30 días antes del vencimiento</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-400 mt-1">•</span>
            <span>Si hay cambios en la prima, tu ejecutivo te contactará para confirmar</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-400 mt-1">•</span>
            <span>Puedes contactar a tu ejecutivo para modificar coberturas antes de renovar</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
