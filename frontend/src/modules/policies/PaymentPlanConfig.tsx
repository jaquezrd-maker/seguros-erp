import { useState, useEffect } from "react"
import { Calendar, Plus, Trash2, Bell } from "lucide-react"

interface PaymentSchedule {
  month: number
  dueDate: string
  amount: number
  reminderDays?: number
}

interface PaymentPlanConfigProps {
  premium: number
  numberOfInstallments: number
  startDate: string
  onChange: (schedule: PaymentSchedule[]) => void
}

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

export default function PaymentPlanConfig({ premium, numberOfInstallments, startDate, onChange }: PaymentPlanConfigProps) {
  const [schedule, setSchedule] = useState<PaymentSchedule[]>([])
  const [customMode, setCustomMode] = useState(false)

  useEffect(() => {
    if (!premium || !startDate || !numberOfInstallments) return

    if (!customMode) {
      generateAutomaticSchedule()
    }
  }, [premium, numberOfInstallments, startDate, customMode])

  useEffect(() => {
    onChange(schedule)
  }, [schedule])

  const generateAutomaticSchedule = () => {
    if (!premium || !startDate || !numberOfInstallments) return

    const start = new Date(startDate)
    const newSchedule: PaymentSchedule[] = []
    const amountPerPayment = premium / numberOfInstallments

    // Generar cuotas mensuales (1-6 cuotas)
    for (let i = 0; i < numberOfInstallments; i++) {
      const dueDate = new Date(start)
      dueDate.setMonth(dueDate.getMonth() + i) // Incremento mensual

      newSchedule.push({
        month: dueDate.getMonth() + 1,
        dueDate: dueDate.toISOString().split('T')[0],
        amount: amountPerPayment,
        reminderDays: 7
      })
    }

    setSchedule(newSchedule)
  }

  const addPayment = () => {
    const lastDate = schedule.length > 0 
      ? new Date(schedule[schedule.length - 1].dueDate)
      : new Date(startDate)
    
    const nextDate = new Date(lastDate)
    nextDate.setMonth(nextDate.getMonth() + 1)

    const remainingAmount = premium - schedule.reduce((sum, p) => sum + p.amount, 0)

    setSchedule([...schedule, {
      month: nextDate.getMonth() + 1,
      dueDate: nextDate.toISOString().split('T')[0],
      amount: Math.max(0, remainingAmount),
      reminderDays: 7
    }])
  }

  const removePayment = (index: number) => {
    setSchedule(schedule.filter((_, i) => i !== index))
  }

  const updatePayment = (index: number, field: keyof PaymentSchedule, value: any) => {
    const newSchedule = [...schedule]
    if (field === 'dueDate') {
      const date = new Date(value)
      newSchedule[index] = {
        ...newSchedule[index],
        dueDate: value,
        month: date.getMonth() + 1
      }
    } else {
      newSchedule[index] = { ...newSchedule[index], [field]: value }
    }
    setSchedule(newSchedule)
  }

  const totalScheduled = schedule.reduce((sum, p) => sum + Number(p.amount), 0)
  const difference = premium - totalScheduled

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Plan de Pagos</h3>
        <button
          type="button"
          onClick={() => {
            setCustomMode(!customMode)
            if (customMode) generateAutomaticSchedule()
          }}
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
        >
          {customMode ? "Automático" : "Personalizado"}
        </button>
      </div>

      {!customMode && (
        <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
          <p className="text-xs text-slate-400 mb-2">Plan automático basado en el método de pago:</p>
          <p className="text-sm text-white">
            <span className="font-semibold">{schedule.length}</span> cuotas de{" "}
            <span className="font-semibold">RD${(premium / schedule.length).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </p>
        </div>
      )}

      {customMode && (
        <div className="space-y-3">
          {schedule.map((payment, index) => (
            <div key={index} className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
              <div className="flex items-start gap-3">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Fecha de Vencimiento</label>
                    <input
                      type="date"
                      value={payment.dueDate}
                      onChange={(e) => updatePayment(index, 'dueDate', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Mes</label>
                    <input
                      type="text"
                      value={monthNames[payment.month - 1]}
                      disabled
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Monto (RD$)</label>
                    <input
                      type="number"
                      value={payment.amount}
                      onChange={(e) => updatePayment(index, 'amount', Number(e.target.value))}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1">
                      <Bell size={12} />
                      Recordar (días antes)
                    </label>
                    <input
                      type="number"
                      value={payment.reminderDays || 7}
                      onChange={(e) => updatePayment(index, 'reminderDays', Number(e.target.value))}
                      min="1"
                      max="30"
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removePayment(index)}
                  className="mt-6 p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addPayment}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-700 hover:border-teal-500 text-slate-400 hover:text-teal-400 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            <span className="text-sm">Agregar Pago</span>
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-slate-400 mb-1">Prima Total</p>
            <p className="text-sm font-semibold text-white">RD${premium.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Total Programado</p>
            <p className="text-sm font-semibold text-white">RD${totalScheduled.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Diferencia</p>
            <p className={`text-sm font-semibold ${Math.abs(difference) < 0.01 ? 'text-emerald-400' : 'text-red-400'}`}>
              RD${difference.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        {Math.abs(difference) > 0.01 && (
          <p className="text-xs text-amber-400 mt-3 text-center">
            ⚠️ La suma de los pagos debe igualar la prima total
          </p>
        )}
      </div>

      {/* Schedule Preview */}
      {schedule.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">Vista previa del plan:</p>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Bell size={12} className="text-amber-400" />
              <span>Recordatorios activos</span>
            </div>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {schedule.map((payment, index) => {
              const dueDate = new Date(payment.dueDate)
              const reminderDate = new Date(dueDate)
              reminderDate.setDate(reminderDate.getDate() - (payment.reminderDays || 7))
              
              return (
                <div key={index} className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/30 hover:border-slate-600/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{monthNames[payment.month - 1]}</p>
                        <p className="text-xs text-slate-400">Cuota {index + 1} de {schedule.length}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">
                        RD${payment.amount.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 bg-slate-800/50 rounded px-2 py-1.5">
                      <Calendar size={12} className="text-teal-400" />
                      <span className="text-slate-400">Vence:</span>
                      <span className="text-white">{payment.dueDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-amber-500/10 rounded px-2 py-1.5">
                      <Bell size={12} className="text-amber-400" />
                      <span className="text-slate-400">Recordar:</span>
                      <span className="text-white">{reminderDate.toISOString().split('T')[0]}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Reminder Info */}
      {schedule.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <Bell size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-blue-400 mb-1">Recordatorios Automáticos</p>
              <p className="text-xs text-slate-400">
                Se enviarán notificaciones automáticas al cliente y al usuario {!customMode && '7 días'} antes de cada fecha de vencimiento.
                {customMode && ' Los días de recordatorio se pueden personalizar para cada pago.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
