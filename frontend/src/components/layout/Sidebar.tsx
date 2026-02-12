import { Home, Users, Building2, Shield, RefreshCw, AlertTriangle, CreditCard, DollarSign, Lock, BarChart3, Menu, Bell, Brain, Briefcase, Settings } from "lucide-react"
import { useAuthStore } from "../../store/authStore"

const baseMenuItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "ai", label: "Asistente IA", icon: Brain },
  { id: "clients", label: "Clientes", icon: Users },
  { id: "insurers", label: "Aseguradoras", icon: Building2 },
  { id: "policies", label: "Pólizas", icon: Shield },
  { id: "renewals", label: "Renovaciones", icon: RefreshCw },
  { id: "claims", label: "Siniestros", icon: AlertTriangle },
  { id: "payments", label: "Pagos", icon: CreditCard },
  { id: "commissions", label: "Comisiones", icon: DollarSign },
  { id: "users", label: "Usuarios", icon: Lock },
  { id: "reports", label: "Reportes", icon: BarChart3 },
  { id: "notifications", label: "Notificaciones", icon: Bell },
]

const superAdminItems = [
  { id: "companies", label: "Empresas", icon: Briefcase },
  { id: "permissions", label: "Permisos", icon: Settings },
]

interface SidebarProps {
  active: string
  setActive: (id: string) => void
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}

export default function Sidebar({ active, setActive, collapsed, setCollapsed, mobileMenuOpen, setMobileMenuOpen }: SidebarProps) {
  const { user } = useAuthStore()

  // Build menu items based on user role
  const menuItems = [...baseMenuItems]
  if (user?.globalRole === 'SUPER_ADMIN') {
    menuItems.push(...superAdminItems)
  }

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full bg-slate-900 border-r border-slate-700/50 transition-all duration-300
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          w-[250px]
          z-50
          md:translate-x-0
          md:z-40
          ${collapsed ? 'md:w-[68px]' : 'md:w-[250px]'}`}
        aria-label="Main navigation"
      >
        <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-700/50">
          {!collapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                <Shield size={16} className="text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-white truncate tracking-tight">SeguroPro</h1>
                <p className="text-[10px] text-slate-500 truncate">Corredora de Seguros</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center mx-auto">
              <Shield size={16} className="text-white" />
            </div>
          )}
        </div>
        <nav className="p-2 space-y-0.5 mt-2">
          {menuItems.map(item => {
            const Icon = item.icon
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActive(item.id)
                  setMobileMenuOpen(false) // Close menu on mobile when item clicked
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive ? "bg-teal-500/15 text-teal-400 shadow-lg shadow-teal-500/5" : "text-slate-400 hover:text-white hover:bg-slate-800"}
                  ${collapsed ? "md:justify-center" : ""}`}
              >
                <Icon size={18} className={isActive ? "text-teal-400" : ""} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute bottom-4 left-0 right-0 mx-auto w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <Menu size={14} />
        </button>
      </aside>
    </>
  )
}
