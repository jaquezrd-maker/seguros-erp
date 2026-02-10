import { useState } from "react"
import { BarChart3 } from "lucide-react"
import { api } from "../../api/client"
import { fmt } from "../../utils/format"
import StatCard from "../../components/ui/StatCard"
import FormInput from "../../components/ui/FormInput"

interface SalesData {
  totalPolicies: number
  totalPremium: number
  byInsurer: Array<{ name: string; count: number; premium: number }>
  byType: Array<{ name: string; count: number; premium: number }>
}

interface CommissionsData {
  totalAmount: number
  totalPaid: number
  totalPending: number
  byProducer: Array<{ name: string; amount: number; paid: number; pending: number }>
}

interface ClaimsData {
  totalClaims: number
  totalEstimated: number
  totalApproved: number
  byStatus: Array<{ status: string; count: number; amount: number }>
}

interface ProductionData {
  year: number
  groupBy: string
  totalPolicies: number
  totalPremium: number
  data: Array<{ period: string; count: number; premium: number }>
}

interface ClientsAnalysisData {
  summary: {
    totalClients: number
    newClients: number
    renewedClients: number
    newClientsPremium: number
    renewedClientsPremium: number
    retentionRate: string
  }
  newClients: Array<{ id: number; name: string; policies: number; premium: number }>
  renewedClients: Array<{ id: number; name: string; policies: number; premium: number }>
}

interface TopInsurersData {
  topInsurers: Array<{
    rank: number
    id: number
    name: string
    policies: number
    premium: number
    commissions: number
  }>
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState("sales")
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3)
    return d.toISOString().split("T")[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0])
  const [year, setYear] = useState(() => new Date().getFullYear().toString())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sales, setSales] = useState<SalesData | null>(null)
  const [commissions, setCommissions] = useState<CommissionsData | null>(null)
  const [claims, setClaims] = useState<ClaimsData | null>(null)
  const [production, setProduction] = useState<ProductionData | null>(null)
  const [clientsAnalysis, setClientsAnalysis] = useState<ClientsAnalysisData | null>(null)
  const [topInsurers, setTopInsurers] = useState<TopInsurersData | null>(null)

  const runReport = async () => {
    setLoading(true)
    setError("")
    // Clear previous reports
    setSales(null)
    setCommissions(null)
    setClaims(null)
    setProduction(null)
    setClientsAnalysis(null)
    setTopInsurers(null)

    try {
      const qs = `startDate=${startDate}&endDate=${endDate}`

      if (reportType === "sales") {
        const r = await api.get<{ success: boolean; data: SalesData }>(`/reports/sales?${qs}`)
        setSales(r.data)
      } else if (reportType === "commissions") {
        const r = await api.get<{ success: boolean; data: CommissionsData }>(`/reports/commissions?${qs}`)
        setCommissions(r.data)
      } else if (reportType === "claims") {
        const r = await api.get<{ success: boolean; data: ClaimsData }>(`/reports/claims?${qs}`)
        setClaims(r.data)
      } else if (reportType === "production") {
        const r = await api.get<{ success: boolean; data: ProductionData }>(`/reports/production?year=${year}&groupBy=month`)
        setProduction(r.data)
      } else if (reportType === "clients") {
        const r = await api.get<{ success: boolean; data: ClientsAnalysisData }>(`/reports/clients-analysis?${qs}`)
        setClientsAnalysis(r.data)
      } else if (reportType === "topInsurers") {
        const r = await api.get<{ success: boolean; data: TopInsurersData }>(`/reports/top-insurers?${qs}&limit=10`)
        setTopInsurers(r.data)
      }
    } catch (err: any) {
      console.error('Error generating report:', err)
      let errorMessage = "Error al generar reporte"

      if (err.response?.status === 403) {
        errorMessage = "⚠️ No tiene permisos para ver este reporte. Los reportes requieren roles específicos (ADMINISTRADOR, CONTABILIDAD, o EJECUTIVO según el tipo)."
      } else if (err.response?.status === 401) {
        errorMessage = "Su sesión ha expirado. Por favor inicie sesión nuevamente."
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getRoleInfo = () => {
    const roleMap: Record<string, string> = {
      sales: "Requiere rol: ADMINISTRADOR o CONTABILIDAD",
      commissions: "Requiere rol: ADMINISTRADOR o CONTABILIDAD",
      claims: "Requiere rol: ADMINISTRADOR o EJECUTIVO",
      production: "Requiere rol: ADMINISTRADOR o CONTABILIDAD",
      clients: "Requiere rol: ADMINISTRADOR o CONTABILIDAD",
      topInsurers: "Requiere rol: ADMINISTRADOR o CONTABILIDAD"
    }
    return roleMap[reportType] || ""
  }

  const needsDateRange = !["production"].includes(reportType)

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Generar Reporte</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormInput label="Tipo de Reporte" type="select" value={reportType} onChange={setReportType}
            options={[
              { value: "sales", label: "Ventas / Primas" },
              { value: "commissions", label: "Comisiones" },
              { value: "claims", label: "Siniestros" },
              { value: "production", label: "Producción por Mes/Año" },
              { value: "clients", label: "Clientes Nuevos vs Renovados" },
              { value: "topInsurers", label: "Top Aseguradoras" },
            ]} />
          {needsDateRange ? (
            <>
              <FormInput label="Fecha Inicio" type="date" value={startDate} onChange={setStartDate} />
              <FormInput label="Fecha Fin" type="date" value={endDate} onChange={setEndDate} />
            </>
          ) : (
            <FormInput label="Año" type="select" value={year} onChange={setYear}
              options={[
                { value: "2024", label: "2024" },
                { value: "2025", label: "2025" },
                { value: "2026", label: "2026" },
              ]} />
          )}
          <div className="flex items-end">
            <button onClick={runReport} disabled={loading}
              className="w-full px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
              {loading ? "Generando..." : "Generar"}
            </button>
          </div>
        </div>
        {reportType && (
          <div className="mt-3 bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
            <p className="text-xs text-blue-300">ℹ️ {getRoleInfo()}</p>
          </div>
        )}
        {error && <div className="bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl p-3 mt-4 text-sm">{error}</div>}
      </div>

      {reportType === "sales" && sales && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard title="Total Pólizas" value={sales.totalPolicies} icon={BarChart3} color="teal" />
            <StatCard title="Prima Total" value={fmt(sales.totalPremium)} icon={BarChart3} color="indigo" />
          </div>
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-5">
            <h4 className="text-sm font-semibold text-white mb-3">Por Aseguradora</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-slate-400 text-xs uppercase">
                  <th className="text-left pb-2">Aseguradora</th><th className="text-right pb-2">Pólizas</th><th className="text-right pb-2">Prima</th>
                </tr></thead>
                <tbody>
                  {sales.byInsurer?.map((row, i) => (
                    <tr key={i} className="border-t border-slate-700/30">
                      <td className="py-2 text-white">{row.name}</td>
                      <td className="py-2 text-right text-slate-300">{row.count}</td>
                      <td className="py-2 text-right text-slate-300">{fmt(row.premium)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reportType === "commissions" && commissions && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Total Comisiones" value={fmt(commissions.totalAmount)} icon={BarChart3} color="teal" />
            <StatCard title="Pagadas" value={fmt(commissions.totalPaid)} icon={BarChart3} color="emerald" />
            <StatCard title="Pendientes" value={fmt(commissions.totalPending)} icon={BarChart3} color="amber" />
          </div>
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-5">
            <h4 className="text-sm font-semibold text-white mb-3">Por Productor</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-slate-400 text-xs uppercase">
                  <th className="text-left pb-2">Productor</th><th className="text-right pb-2">Total</th><th className="text-right pb-2">Pagado</th><th className="text-right pb-2">Pendiente</th>
                </tr></thead>
                <tbody>
                  {commissions.byProducer?.map((row, i) => (
                    <tr key={i} className="border-t border-slate-700/30">
                      <td className="py-2 text-white">{row.name}</td>
                      <td className="py-2 text-right text-slate-300">{fmt(row.amount)}</td>
                      <td className="py-2 text-right text-emerald-400">{fmt(row.paid)}</td>
                      <td className="py-2 text-right text-amber-400">{fmt(row.pending)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reportType === "claims" && claims && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Total Siniestros" value={claims.totalClaims} icon={BarChart3} color="red" />
            <StatCard title="Monto Estimado" value={fmt(claims.totalEstimated)} icon={BarChart3} color="amber" />
            <StatCard title="Monto Aprobado" value={fmt(claims.totalApproved)} icon={BarChart3} color="emerald" />
          </div>
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-5">
            <h4 className="text-sm font-semibold text-white mb-3">Por Estado</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-slate-400 text-xs uppercase">
                  <th className="text-left pb-2">Estado</th><th className="text-right pb-2">Cantidad</th><th className="text-right pb-2">Monto</th>
                </tr></thead>
                <tbody>
                  {claims.byStatus?.map((row, i) => (
                    <tr key={i} className="border-t border-slate-700/30">
                      <td className="py-2 text-white capitalize">{row.status.toLowerCase().replace(/_/g, " ")}</td>
                      <td className="py-2 text-right text-slate-300">{row.count}</td>
                      <td className="py-2 text-right text-slate-300">{fmt(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reportType === "production" && production && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard title="Total Pólizas" value={production.totalPolicies} icon={BarChart3} color="teal" />
            <StatCard title="Prima Total" value={fmt(production.totalPremium)} icon={BarChart3} color="indigo" />
          </div>
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-5">
            <h4 className="text-sm font-semibold text-white mb-3">Producción Mensual - {production.year}</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-slate-400 text-xs uppercase">
                  <th className="text-left pb-2">Mes</th><th className="text-right pb-2">Pólizas</th><th className="text-right pb-2">Prima</th>
                </tr></thead>
                <tbody>
                  {production.data?.map((row, i) => (
                    <tr key={i} className="border-t border-slate-700/30">
                      <td className="py-2 text-white">{row.period}</td>
                      <td className="py-2 text-right text-slate-300">{row.count}</td>
                      <td className="py-2 text-right text-slate-300">{fmt(row.premium)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reportType === "clients" && clientsAnalysis && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Total Clientes" value={clientsAnalysis.summary.totalClients} icon={BarChart3} color="teal" />
            <StatCard title="Nuevos" value={clientsAnalysis.summary.newClients}
              subtitle={fmt(clientsAnalysis.summary.newClientsPremium)} icon={BarChart3} color="emerald" />
            <StatCard title="Renovados" value={clientsAnalysis.summary.renewedClients}
              subtitle={fmt(clientsAnalysis.summary.renewedClientsPremium)} icon={BarChart3} color="indigo" />
          </div>
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-5 mb-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">Tasa de Retención</h4>
              <div className="text-2xl font-bold text-teal-400">{clientsAnalysis.summary.retentionRate}%</div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-5">
              <h4 className="text-sm font-semibold text-white mb-3">Clientes Nuevos ({clientsAnalysis.summary.newClients})</h4>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead><tr className="text-slate-400 text-xs uppercase sticky top-0 bg-slate-800">
                    <th className="text-left pb-2">Cliente</th><th className="text-right pb-2">Pólizas</th><th className="text-right pb-2">Prima</th>
                  </tr></thead>
                  <tbody>
                    {clientsAnalysis.newClients?.map((row, i) => (
                      <tr key={i} className="border-t border-slate-700/30">
                        <td className="py-2 text-white">{row.name}</td>
                        <td className="py-2 text-right text-slate-300">{row.policies}</td>
                        <td className="py-2 text-right text-slate-300">{fmt(row.premium)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-5">
              <h4 className="text-sm font-semibold text-white mb-3">Clientes Renovados ({clientsAnalysis.summary.renewedClients})</h4>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead><tr className="text-slate-400 text-xs uppercase sticky top-0 bg-slate-800">
                    <th className="text-left pb-2">Cliente</th><th className="text-right pb-2">Pólizas</th><th className="text-right pb-2">Prima</th>
                  </tr></thead>
                  <tbody>
                    {clientsAnalysis.renewedClients?.map((row, i) => (
                      <tr key={i} className="border-t border-slate-700/30">
                        <td className="py-2 text-white">{row.name}</td>
                        <td className="py-2 text-right text-slate-300">{row.policies}</td>
                        <td className="py-2 text-right text-slate-300">{fmt(row.premium)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportType === "topInsurers" && topInsurers && (
        <div className="space-y-6">
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-5">
            <h4 className="text-sm font-semibold text-white mb-3">Top 10 Aseguradoras Más Rentables</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-slate-400 text-xs uppercase">
                  <th className="text-left pb-2">Ranking</th>
                  <th className="text-left pb-2">Aseguradora</th>
                  <th className="text-right pb-2">Pólizas</th>
                  <th className="text-right pb-2">Prima Total</th>
                  <th className="text-right pb-2">Comisiones</th>
                </tr></thead>
                <tbody>
                  {topInsurers.topInsurers?.map((row) => (
                    <tr key={row.id} className="border-t border-slate-700/30">
                      <td className="py-2">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          row.rank === 1 ? "bg-amber-500 text-white" :
                          row.rank === 2 ? "bg-slate-400 text-white" :
                          row.rank === 3 ? "bg-orange-600 text-white" :
                          "bg-slate-700 text-slate-300"
                        }`}>
                          {row.rank}
                        </span>
                      </td>
                      <td className="py-2 text-white font-medium">{row.name}</td>
                      <td className="py-2 text-right text-slate-300">{row.policies}</td>
                      <td className="py-2 text-right text-emerald-400 font-medium">{fmt(row.premium)}</td>
                      <td className="py-2 text-right text-teal-400">{fmt(row.commissions)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
