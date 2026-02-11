import { useState, useEffect } from "react"
import { Shield, CreditCard, RefreshCw, AlertTriangle } from "lucide-react"
import { api } from "../../api/client"
import StatCard from "../../components/ui/StatCard"
import { fmtDate, fmt } from "../../utils/format"
import StatusBadge from "../../components/ui/StatusBadge"

interface DashboardStats {
  activePolicies: number
  pendingPayments: number
  pendingRenewals: number
  activeClaims: number
}

interface Policy {
  id: number
  policyNumber: string
  status: string
  startDate: string
  endDate: string
  premium: number
  insurer: { name: string }
  insuranceType: { name: string }
}

interface Payment {
  id: number
  amount: number
  paymentDate: string
  dueDate: string
  status: string
  policy: { policyNumber: string }
}

export default function ClientDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activePolicies: 0,
    pendingPayments: 0,
    pendingRenewals: 0,
    activeClaims: 0
  })
  const [recentPolicies, setRecentPolicies] = useState<Policy[]>([])
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, policiesRes, paymentsRes] = await Promise.all([
          api.get<{ success: boolean; data: DashboardStats }>('/client-portal-data/dashboard'),
          api.get<{ success: boolean; data: Policy[] }>('/client-portal-data/policies?limit=5'),
          api.get<{ success: boolean; data: Payment[] }>('/client-portal-data/payments')
        ])

        setStats(statsRes.data)
        setRecentPolicies(policiesRes.data)
        setRecentPayments(paymentsRes.data.slice(0, 5))
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Cargando información...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Bienvenido a tu Portal</h1>
        <p className="text-slate-400">Aquí puedes consultar toda la información sobre tus pólizas y servicios</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pólizas Activas"
          value={stats.activePolicies}
          icon={Shield}
          color="teal"
        />
        <StatCard
          title="Pagos Pendientes"
          value={stats.pendingPayments}
          icon={CreditCard}
          color="amber"
        />
        <StatCard
          title="Renovaciones"
          value={stats.pendingRenewals}
          icon={RefreshCw}
          color="teal"
        />
        <StatCard
          title="Reclamos Activos"
          value={stats.activeClaims}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Pólizas Recientes */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Tus Pólizas Recientes</h2>
        {recentPolicies.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">No tienes pólizas registradas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Número</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Aseguradora</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Tipo</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Vigencia</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Prima</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {recentPolicies.map((policy) => (
                  <tr key={policy.id} className="hover:bg-slate-800/30">
                    <td className="px-3 py-3 text-slate-300">{policy.policyNumber}</td>
                    <td className="px-3 py-3 text-slate-300">{policy.insurer.name}</td>
                    <td className="px-3 py-3 text-slate-300">{policy.insuranceType.name}</td>
                    <td className="px-3 py-3 text-slate-300 text-xs">
                      {fmtDate(policy.startDate)} - {fmtDate(policy.endDate)}
                    </td>
                    <td className="px-3 py-3 text-slate-300">{fmt(policy.premium)}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={policy.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagos Recientes */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Pagos Recientes</h2>
        {recentPayments.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">No hay pagos registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Póliza</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Monto</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Fecha Pago</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Vencimiento</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {recentPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-800/30">
                    <td className="px-3 py-3 text-slate-300">{payment.policy.policyNumber}</td>
                    <td className="px-3 py-3 text-slate-300 font-semibold">{fmt(payment.amount)}</td>
                    <td className="px-3 py-3 text-slate-300">{fmtDate(payment.paymentDate)}</td>
                    <td className="px-3 py-3 text-slate-300">{payment.dueDate ? fmtDate(payment.dueDate) : '—'}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={payment.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
