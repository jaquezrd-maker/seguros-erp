import { useState, useEffect } from "react"
import { Bell, Send, Calendar, User, TrendingUp } from "lucide-react"
import { api } from "../../api/client"
import { fmt, fmtDate } from "../../utils/format"

interface UpcomingReminder {
  id: number
  client: {
    id: number
    name: string
    email: string
    phone: string
  }
  policy: {
    id: number
    policyNumber: string
    insurer: {
      id: number
      name: string
    }
  }
  amount: number
  dueDate: string
  reminderDate: string
  reminderDays: number
  concept: string
}

interface NotificationStats {
  totalPendingPayments: number
  paymentsWithReminders: number
  remindersSent: number
  upcomingReminders: number
}

export default function NotificationManager() {
  const [reminders, setReminders] = useState<UpcomingReminder[]>([])
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [remindersRes, statsRes] = await Promise.all([
        api.get<{ success: boolean; data: UpcomingReminder[] }>('/notifications/reminders/upcoming'),
        api.get<{ success: boolean; data: NotificationStats }>('/notifications/statistics'),
      ])
      setReminders(remindersRes.data)
      setStats(statsRes.data)
    } catch (error) {
      console.error('Error fetching notification data:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerReminders = async () => {
    setSending(true)
    try {
      await api.post('/notifications/reminders/trigger', {})
      alert('Recordatorios enviados exitosamente')
      fetchData()
    } catch (error) {
      console.error('Error triggering reminders:', error)
      alert('Error al enviar recordatorios')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8 text-slate-400">
        Cargando notificaciones...
      </div>
    )
  }

  const today = new Date()

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Pagos Pendientes</p>
              <Calendar size={16} className="text-slate-500" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalPendingPayments}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Con Recordatorios</p>
              <Bell size={16} className="text-teal-500" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.paymentsWithReminders}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Enviados</p>
              <Send size={16} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.remindersSent}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Próximos (30 días)</p>
              <TrendingUp size={16} className="text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.upcomingReminders}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <div>
          <h3 className="text-sm font-semibold text-white mb-1">Enviar Recordatorios Manualmente</h3>
          <p className="text-xs text-slate-400">Los recordatorios se envían automáticamente cada día a las 9:00 AM</p>
        </div>
        <button
          onClick={triggerReminders}
          disabled={sending}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Send size={16} />
          {sending ? 'Enviando...' : 'Enviar Ahora'}
        </button>
      </div>

      {/* Upcoming Reminders */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Próximos Recordatorios (30 días)</h3>
        {reminders.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No hay recordatorios próximos
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => {
              const dueDate = new Date(reminder.dueDate)
              const reminderDate = new Date(reminder.reminderDate)
              const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              const daysUntilReminder = Math.ceil((reminderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              const isReminderToday = daysUntilReminder === 0
              const isOverdue = daysUntilDue < 0

              return (
                <div
                  key={reminder.id}
                  className={`bg-slate-900/50 rounded-xl p-4 border transition-colors ${
                    isReminderToday
                      ? 'border-amber-500/50 bg-amber-500/5'
                      : isOverdue
                      ? 'border-red-500/50 bg-red-500/5'
                      : 'border-slate-700/50 hover:border-slate-600/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isReminderToday ? 'bg-amber-500/20' : isOverdue ? 'bg-red-500/20' : 'bg-teal-500/20'
                      }`}>
                        <Bell size={18} className={isReminderToday ? 'text-amber-400' : isOverdue ? 'text-red-400' : 'text-teal-400'} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-white">{reminder.client.name}</h4>
                          {isReminderToday && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                              Enviar hoy
                            </span>
                          )}
                          {isOverdue && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                              Vencido
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mb-2">{reminder.concept}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1.5">
                            <User size={12} className="text-slate-500" />
                            <span className="text-slate-400">Contacto:</span>
                            <span className="text-white">{reminder.client.email || reminder.client.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">Póliza:</span>
                            <span className="text-white">{reminder.policy.policyNumber}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">{fmt(reminder.amount)}</p>
                      <p className="text-xs text-slate-400">Monto</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-800/50 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-400 mb-0.5">Recordatorio</p>
                      <p className="text-sm font-medium text-white">{fmtDate(reminder.reminderDate)}</p>
                      <p className="text-xs text-amber-400">{daysUntilReminder} día{daysUntilReminder !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-400 mb-0.5">Vencimiento</p>
                      <p className="text-sm font-medium text-white">{fmtDate(reminder.dueDate)}</p>
                      <p className={`text-xs ${isOverdue ? 'text-red-400' : 'text-teal-400'}`}>
                        {Math.abs(daysUntilDue)} día{Math.abs(daysUntilDue) !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
