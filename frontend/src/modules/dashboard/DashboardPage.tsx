import { useState, useEffect } from "react"
import { Users, Shield, AlertTriangle, DollarSign, TrendingUp } from "lucide-react"
import { api } from "../../api/client"
import { fmt, fmtDate } from "../../utils/format"
import StatCard from "../../components/ui/StatCard"
import StatusBadge from "../../components/ui/StatusBadge"
import Calendar from "../../components/calendar/Calendar"

interface DashboardData {
  totalClients: number
  totalPolicies: number
  activePolicies: number
  totalPremium: number
  totalClaims: number
  pendingClaims: number
  totalCommissions: number
  pendingRenewals: number
}

interface RecentClaim {
  id: number
  claimNumber: string
  type: string
  status: string
  estimatedAmount?: number
  policy?: { client?: { name: string } }
}

interface PendingRenewal {
  id: number
  originalEndDate: string
  status: string
  policy?: { policyNumber: string; client?: { name: string }; insurer?: { name: string } }
}

interface UpcomingPayment {
  id: number
  amount: number
  dueDate: string
  status: string
  policy?: { policyNumber: string; status: string }
  client?: { name: string; cedulaRnc: string }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [claims, setClaims] = useState<RecentClaim[]>([])
  const [renewals, setRenewals] = useState<PendingRenewal[]>([])
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<{ success: boolean; data: DashboardData }>("/reports/dashboard").then(r => setData(r.data)).catch(() => {}),
      api.get<{ success: boolean; data: RecentClaim[] }>("/claims?limit=5").then(r => setClaims(r.data)).catch(() => {}),
      api.get<{ success: boolean; data: PendingRenewal[] }>("/renewals/pending").then(r => setRenewals(r.data)).catch(() => {}),
      api.get<{ success: boolean; data: UpcomingPayment[] }>("/payments/upcoming?days=15").then(r => setUpcomingPayments(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Clientes" value={data?.totalClients ?? 0} icon={Users} color="teal" />
        <StatCard title="Pólizas Activas" value={data?.activePolicies ?? 0} subtitle={`${data?.totalPolicies ?? 0} total`} icon={Shield} color="indigo" />
        <StatCard title="Prima Total" value={fmt(data?.totalPremium ?? 0)} icon={TrendingUp} color="emerald" />
        <StatCard title="Siniestros Pendientes" value={data?.pendingClaims ?? 0} subtitle={`${data?.totalClaims ?? 0} total`} icon={AlertTriangle} color="red" />
      </div>

      {/* Calendar Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Calendario de Eventos y Recordatorios</h2>
        <Calendar />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Pagos Próximos a Vencer</h3>
          <div className="space-y-3">
            {upcomingPayments.length === 0 ? (
              <p className="text-slate-500 text-sm">No hay pagos próximos a vencer</p>
            ) : (
              upcomingPayments.slice(0, 5).map(p => {
                const days = Math.ceil((new Date(p.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                return (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                    <div>
                      <p className="text-sm text-white">{p.client?.name || "—"}</p>
                      <p className="text-xs text-slate-500">{p.policy?.policyNumber || "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-emerald-400">{fmt(p.amount)}</p>
                      <p className={`text-xs ${days <= 3 ? "text-red-400" : days <= 7 ? "text-amber-400" : "text-slate-500"}`}>
                        {days === 0 ? "Hoy" : days === 1 ? "Mañana" : `${days} días`}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Renovaciones Próximas</h3>
          <div className="space-y-3">
            {renewals.length === 0 ? (
              <p className="text-slate-500 text-sm">No hay renovaciones pendientes</p>
            ) : (
              renewals.slice(0, 5).map(r => {
                const days = Math.ceil((new Date(r.originalEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                return (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                    <div>
                      <p className="text-sm text-white">{r.policy?.client?.name || "—"}</p>
                      <p className="text-xs text-slate-500">{r.policy?.policyNumber} · {r.policy?.insurer?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${days < 0 ? "text-red-400" : days <= 30 ? "text-amber-400" : "text-emerald-400"}`}>
                        {days < 0 ? `Vencida (${Math.abs(days)}d)` : `${days} días`}
                      </p>
                      <p className="text-xs text-slate-500">{fmtDate(r.originalEndDate)}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Siniestros Recientes</h3>
          <div className="space-y-3">
            {claims.length === 0 ? (
              <p className="text-slate-500 text-sm">No hay siniestros recientes</p>
            ) : (
              claims.map(c => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                  <div>
                    <p className="text-sm text-white">{c.policy?.client?.name || "—"}</p>
                    <p className="text-xs text-slate-500">{c.claimNumber} · {c.type}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    {c.estimatedAmount && <span className="text-sm text-slate-300">{fmt(c.estimatedAmount)}</span>}
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Comisiones Generadas" value={fmt(data?.totalCommissions ?? 0)} icon={DollarSign} color="purple" />
        <StatCard title="Renovaciones Pendientes" value={data?.pendingRenewals ?? 0} icon={Shield} color="amber" />
      </div>
    </div>
  )
}
