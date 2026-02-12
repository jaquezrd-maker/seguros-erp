import { Bell, LogOut, X, Sun, Moon, Menu, Building2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import { useState, useEffect } from "react"
import { api } from "../../api/client"
import { fmtDate } from "../../utils/format"
import { CompanySelector } from "./CompanySelector"
import { useAuthStore } from "../../store/authStore"

interface TopBarProps {
  title: string
  collapsed: boolean
  userName?: string
  userRole?: string
  onMenuClick: () => void
}

interface Renewal {
  id: number
  originalEndDate: string
  policy?: { policyNumber: string; client?: { name: string } }
}

interface Payment {
  id: number
  dueDate: string
  amount: number
  policy?: { policyNumber: string }
  client?: { name: string }
}

export default function TopBar({ title, collapsed, userName = "Usuario", userRole = "Usuario", onMenuClick }: TopBarProps) {
  const { signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { user, getActiveCompany } = useAuthStore()
  const activeCompany = getActiveCompany()
  const isSuperAdmin = user?.globalRole === 'SUPER_ADMIN'
  const initials = userName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
  const [showNotifications, setShowNotifications] = useState(false)
  const [renewals, setRenewals] = useState<Renewal[]>([])
  const [overduePayments, setOverduePayments] = useState<Payment[]>([])

  useEffect(() => {
    // Fetch pending renewals and overdue payments
    api.get<{ success: boolean; data: Renewal[] }>("/renewals/pending")
      .then(r => setRenewals(r.data.slice(0, 5)))
      .catch(() => {})
    
    api.get<{ success: boolean; data: Payment[] }>("/payments/overdue")
      .then(r => setOverduePayments(r.data.slice(0, 5)))
      .catch(() => {})
  }, [])

  const notificationCount = renewals.length + overduePayments.length

  return (
    <header className={`fixed top-0 right-0 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 z-30 flex items-center justify-between px-4 md:px-6 transition-all duration-300 left-0 ${collapsed ? "md:left-[68px]" : "md:left-[250px]"}`}>
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl hover:bg-slate-800 text-white md:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-base md:text-lg font-semibold text-white truncate">{title}</h2>
          {activeCompany && (
            <span className="hidden md:inline-flex px-2 py-1 text-xs font-medium bg-teal-500/20 text-teal-300 rounded-md border border-teal-500/30">
              {activeCompany.name}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <Bell size={18} />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] md:w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="flex items-center justify-between p-3 border-b border-slate-700">
                <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
                <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notificationCount === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-sm">
                    No hay notificaciones
                  </div>
                ) : (
                  <>
                    {renewals.map(r => {
                      const days = Math.ceil((new Date(r.originalEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      return (
                        <div key={`renewal-${r.id}`} className="p-3 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                          <p className="text-xs text-amber-400 font-medium mb-1">Renovación Pendiente</p>
                          <p className="text-sm text-white">{r.policy?.client?.name}</p>
                          <p className="text-xs text-slate-400">{r.policy?.policyNumber} · {days < 0 ? `Vencida hace ${Math.abs(days)} días` : `${days} días restantes`}</p>
                          <p className="text-xs text-slate-500 mt-1">{fmtDate(r.originalEndDate)}</p>
                        </div>
                      )
                    })}
                    {overduePayments.map(p => (
                      <div key={`payment-${p.id}`} className="p-3 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                        <p className="text-xs text-red-400 font-medium mb-1">Pago Vencido</p>
                        <p className="text-sm text-white">{p.client?.name}</p>
                        <p className="text-xs text-slate-400">{p.policy?.policyNumber} · DOP {p.amount.toLocaleString()}</p>
                        <p className="text-xs text-slate-500 mt-1">Vencido el {fmtDate(p.dueDate)}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Company Selector for multi-tenant users */}
        <CompanySelector />

        <button
          onClick={toggleTheme}
          className="hidden sm:flex p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors items-center"
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-700">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-xs font-bold">{initials}</div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-white">{userName}</p>
            <p className="text-[10px] text-slate-500">{userRole}</p>
          </div>
        </div>
        <button onClick={signOut} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors" title="Cerrar sesión">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
