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

export default function ReportsPage() {
  const [reportType, setReportType] = useState("sales")
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3)
    return d.toISOString().split("T")[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sales, setSales] = useState<SalesData | null>(null)
  const [commissions, setCommissions] = useState<CommissionsData | null>(null)
  const [claims, setClaims] = useState<ClaimsData | null>(null)

  const runReport = async () => {
    setLoading(true)
    setError("")
    try {
      const qs = `startDate=${startDate}&endDate=${endDate}`
      if (reportType === "sales") {
        const r = await api.get<{ success: boolean; data: SalesData }>(`/reports/sales?${qs}`)
        setSales(r.data)
      } else if (reportType === "commissions") {
        const r = await api.get<{ success: boolean; data: CommissionsData }>(`/reports/commissions?${qs}`)
        setCommissions(r.data)
      } else {
        const r = await api.get<{ success: boolean; data: ClaimsData }>(`/reports/claims?${qs}`)
        setClaims(r.data)
      }
    } catch (err: any) {
      setError(err.message || "Error al generar reporte")
    } finally {
      setLoading(false)
    }
  }

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
            ]} />
          <FormInput label="Fecha Inicio" type="date" value={startDate} onChange={setStartDate} />
          <FormInput label="Fecha Fin" type="date" value={endDate} onChange={setEndDate} />
          <div className="flex items-end">
            <button onClick={runReport} disabled={loading}
              className="w-full px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
              {loading ? "Generando..." : "Generar"}
            </button>
          </div>
        </div>
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
    </div>
  )
}
