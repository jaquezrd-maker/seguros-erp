import { useState, useEffect } from "react"
import { CreditCard, DollarSign } from "lucide-react"
import { api } from "../../api/client"
import { fmtDate, fmt } from "../../utils/format"
import StatusBadge from "../../components/ui/StatusBadge"
import StatCard from "../../components/ui/StatCard"

interface Payment {
  id: number
  amount: number
  paymentMethod: string
  paymentDate: string
  dueDate: string | null
  receiptNumber: string | null
  status: string
  concept: string | null
  policy: {
    policyNumber: string
    insurer: { name: string }
  }
}

export default function ClientPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await api.get<{ success: boolean; data: Payment[] }>('/client-portal-data/payments')
        setPayments(response.data)
      } catch (error) {
        console.error('Error fetching payments:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [])

  const filteredPayments = payments.filter(payment => {
    if (filter === "all") return true
    return payment.status === filter
  })

  const totalPaid = payments
    .filter(p => p.status === "COMPLETADO")
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const totalPending = payments
    .filter(p => p.status === "PENDIENTE")
    .reduce((sum, p) => sum + Number(p.amount), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Cargando pagos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Historial de Pagos</h1>
        <p className="text-slate-400">Consulta todos tus pagos realizados y pendientes</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Total Pagado"
          value={fmt(totalPaid)}
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Total Pendiente"
          value={fmt(totalPending)}
          icon={CreditCard}
          color="amber"
        />
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
          Todos ({payments.length})
        </button>
        <button
          onClick={() => setFilter("COMPLETADO")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            filter === "COMPLETADO"
              ? "bg-teal-500/15 text-teal-400 border border-teal-500/30"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          Completados ({payments.filter(p => p.status === "COMPLETADO").length})
        </button>
        <button
          onClick={() => setFilter("PENDIENTE")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            filter === "PENDIENTE"
              ? "bg-teal-500/15 text-teal-400 border border-teal-500/30"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          Pendientes ({payments.filter(p => p.status === "PENDIENTE").length})
        </button>
        <button
          onClick={() => setFilter("VENCIDO")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            filter === "VENCIDO"
              ? "bg-teal-500/15 text-teal-400 border border-teal-500/30"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          Vencidos ({payments.filter(p => p.status === "VENCIDO").length})
        </button>
      </div>

      {/* Tabla de pagos */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">
              {filter === "all"
                ? "No hay pagos registrados"
                : `No hay pagos ${filter.toLowerCase()}`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Póliza</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Aseguradora</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Monto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Método</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha Pago</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Vencimiento</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Recibo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{payment.policy.policyNumber}</td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{payment.policy.insurer.name}</td>
                    <td className="px-4 py-3 text-white font-semibold whitespace-nowrap">{fmt(payment.amount)}</td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{payment.paymentMethod}</td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{fmtDate(payment.paymentDate)}</td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                      {payment.dueDate ? fmtDate(payment.dueDate) : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                      {payment.receiptNumber || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
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
