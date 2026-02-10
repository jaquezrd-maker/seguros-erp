import { LogOut, Menu, User } from "lucide-react"
import { useAuth } from "../../context/AuthContext"

interface ClientTopBarProps {
  title: string
  collapsed: boolean
  onMenuClick: () => void
}

export default function ClientTopBar({ title, collapsed, onMenuClick }: ClientTopBarProps) {
  const { signOut, dbUser } = useAuth()

  const userName = dbUser?.name || "Cliente"
  const initials = userName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 z-30 flex items-center justify-between px-4 md:px-6 transition-all duration-300 left-0 ${collapsed ? "md:left-[68px]" : "md:left-[250px]"}`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl hover:bg-slate-800 text-white md:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-base md:text-lg font-semibold text-white truncate">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-700">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-white">{userName}</p>
            <p className="text-[10px] text-slate-500">Cliente</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
          title="Cerrar sesión"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
