import { useState, useEffect } from "react"
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Users, Shield, DollarSign, CheckCircle } from "lucide-react"
import { api } from "../../api/client"
import { fmt, fmtDate } from "../../utils/format"
import StatCard from "../../components/ui/StatCard"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

interface Insights {
  clients: {
    total: number
    active: number
    withPolicies: number
    withoutPolicies: number
  }
  policies: {
    vigente?: number
    cancelada?: number
    vencida?: number
    en_renovacion?: number
  }
  payments: {
    pendiente?: { count: number; total: number }
    completado?: { count: number; total: number }
    anulado?: { count: number; total: number }
  }
  claims: {
    pendiente?: number
    en_proceso?: number
    aprobado?: number
    rechazado?: number
  }
}

interface Suggestion {
  type: string
  priority: string
  title: string
  description: string
  action: string
  count?: number
  clients?: any[]
  policies?: any[]
  payments?: any[]
  claims?: any[]
}

interface OverallSuggestions {
  clientsWithoutPolicies: { count: number; clients: any[] }
  expiringPolicies: { count: number; policies: any[] }
  overduePayments: { count: number; payments: any[] }
  pendingClaims: { count: number; claims: any[] }
}

const COLORS = {
  vigente: "#10b981",
  cancelada: "#ef4444",
  vencida: "#f59e0b",
  en_renovacion: "#3b82f6",
  pendiente: "#f59e0b",
  completado: "#10b981",
  anulado: "#ef4444",
}

const priorityColors = {
  critical: "bg-red-500/10 border-red-500/50 text-red-400",
  high: "bg-amber-500/10 border-amber-500/50 text-amber-400",
  medium: "bg-blue-500/10 border-blue-500/50 text-blue-400",
  low: "bg-slate-500/10 border-slate-500/50 text-slate-400",
}

export default function AIAssistantPage() {
  const [insights, setInsights] = useState<Insights | null>(null)
  const [suggestions, setSuggestions] = useState<OverallSuggestions | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<{ success: boolean; data: Insights }>("/ai/insights").then(r => setInsights(r.data)).catch(() => {}),
      api.get<{ success: boolean; data: OverallSuggestions }>("/ai/suggestions").then(r => setSuggestions(r.data)).catch(() => {}),
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

  const policyChartData = insights ? [
    { name: "Vigentes", value: insights.policies.vigente || 0, color: COLORS.vigente },
    { name: "Canceladas", value: insights.policies.cancelada || 0, color: COLORS.cancelada },
    { name: "Vencidas", value: insights.policies.vencida || 0, color: COLORS.vencida },
    { name: "En Renovación", value: insights.policies.en_renovacion || 0, color: COLORS.en_renovacion },
  ].filter(d => d.value > 0) : []

  const paymentChartData = insights ? [
    { name: "Completado", value: insights.payments.completado?.total || 0 },
    { name: "Pendiente", value: insights.payments.pendiente?.total || 0 },
  ].filter(d => d.value > 0) : []

  const activityData = suggestions ? [
    { name: "Sin Pólizas", value: suggestions.clientsWithoutPolicies.count },
    { name: "Por Vencer", value: suggestions.expiringPolicies.count },
    { name: "Pagos Vencidos", value: suggestions.overduePayments.count },
    { name: "Reclamos", value: suggestions.pendingClaims.count },
  ] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Asistente IA</h1>
          <p className="text-slate-400 text-sm">Insights inteligentes y sugerencias automáticas</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Clientes" 
          value={insights?.clients.total || 0} 
          icon={Users} 
          color="teal" 
        />
        <StatCard 
          title="Pólizas Activas" 
          value={insights?.policies.vigente || 0} 
          icon={Shield} 
          color="emerald" 
        />
        <StatCard 
          title="Pagos Pendientes" 
          value={insights?.payments.pendiente?.count || 0}
          subtitle={fmt(insights?.payments.pendiente?.total || 0)}
          icon={DollarSign} 
          color="amber" 
        />
        <StatCard 
          title="Oportunidades" 
          value={(suggestions?.clientsWithoutPolicies.count || 0) + (suggestions?.expiringPolicies.count || 0)} 
          icon={TrendingUp} 
          color="purple" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Policy Distribution */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-400" />
            Distribución de Pólizas
          </h3>
          {policyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={policyChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {policyChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-500">
              No hay datos disponibles
            </div>
          )}
        </div>

        {/* Payment Status */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            Estado de Pagos
          </h3>
          {paymentChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={paymentChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }}
                  labelStyle={{ color: '#f1f5f9' }}
                  formatter={(value: any) => fmt(value)}
                />
                <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-500">
              No hay datos disponibles
            </div>
          )}
        </div>
      </div>

      {/* Activity Overview */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          Actividades Pendientes
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={activityData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" stroke="#94a3b8" />
            <YAxis dataKey="name" type="category" stroke="#94a3b8" width={120} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }}
              labelStyle={{ color: '#f1f5f9' }}
            />
            <Bar dataKey="value" fill="#6366f1" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* AI Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clients Without Policies */}
        {suggestions && suggestions.clientsWithoutPolicies.count > 0 && (
          <div className={`rounded-xl border p-5 ${priorityColors.high}`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Clientes sin Pólizas</h4>
                <p className="text-sm opacity-80 mb-3">
                  {suggestions.clientsWithoutPolicies.count} clientes activos no tienen pólizas contratadas
                </p>
                <div className="space-y-2">
                  {suggestions.clientsWithoutPolicies.clients.slice(0, 3).map((client: any) => (
                    <div key={client.id} className="text-xs opacity-70 flex items-center gap-2">
                      <CheckCircle className="w-3 h-3" />
                      {client.name}
                    </div>
                  ))}
                </div>
                <button className="mt-3 text-xs font-medium hover:underline">
                  Ver todos →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Expiring Policies */}
        {suggestions && suggestions.expiringPolicies.count > 0 && (
          <div className={`rounded-xl border p-5 ${priorityColors.high}`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Pólizas por Vencer</h4>
                <p className="text-sm opacity-80 mb-3">
                  {suggestions.expiringPolicies.count} pólizas vencen en los próximos 30 días
                </p>
                <div className="space-y-2">
                  {suggestions.expiringPolicies.policies.slice(0, 3).map((policy: any) => (
                    <div key={policy.id} className="text-xs opacity-70">
                      <div className="flex justify-between">
                        <span>{policy.client?.name}</span>
                        <span>{fmtDate(policy.endDate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-3 text-xs font-medium hover:underline">
                  Iniciar renovaciones →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Overdue Payments */}
        {suggestions && suggestions.overduePayments.count > 0 && (
          <div className={`rounded-xl border p-5 ${priorityColors.critical}`}>
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Pagos Vencidos</h4>
                <p className="text-sm opacity-80 mb-3">
                  {suggestions.overduePayments.count} pagos pendientes vencidos
                </p>
                <div className="space-y-2">
                  {suggestions.overduePayments.payments.slice(0, 3).map((payment: any) => (
                    <div key={payment.id} className="text-xs opacity-70">
                      <div className="flex justify-between">
                        <span>{payment.client?.name}</span>
                        <span>{fmt(payment.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-3 text-xs font-medium hover:underline">
                  Enviar recordatorios →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pending Claims */}
        {suggestions && suggestions.pendingClaims.count > 0 && (
          <div className={`rounded-xl border p-5 ${priorityColors.medium}`}>
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Reclamos Pendientes</h4>
                <p className="text-sm opacity-80 mb-3">
                  {suggestions.pendingClaims.count} reclamos requieren atención
                </p>
                <button className="mt-3 text-xs font-medium hover:underline">
                  Revisar reclamos →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Client Insights */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-teal-400" />
          Análisis de Clientes
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{insights?.clients.total || 0}</div>
            <div className="text-xs text-slate-400 mt-1">Total Clientes</div>
          </div>
          <div className="bg-emerald-500/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-emerald-400">{insights?.clients.active || 0}</div>
            <div className="text-xs text-slate-400 mt-1">Activos</div>
          </div>
          <div className="bg-teal-500/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-teal-400">{insights?.clients.withPolicies || 0}</div>
            <div className="text-xs text-slate-400 mt-1">Con Pólizas</div>
          </div>
          <div className="bg-amber-500/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-amber-400">{insights?.clients.withoutPolicies || 0}</div>
            <div className="text-xs text-slate-400 mt-1">Sin Pólizas</div>
          </div>
        </div>
      </div>
    </div>
  )
}
