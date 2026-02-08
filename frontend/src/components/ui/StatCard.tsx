import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color: "teal" | "indigo" | "amber" | "red" | "emerald" | "blue" | "purple"
}

const colorMap = {
  teal: "from-teal-500 to-cyan-600 shadow-teal-500/20",
  indigo: "from-indigo-500 to-violet-600 shadow-indigo-500/20",
  amber: "from-amber-500 to-orange-600 shadow-amber-500/20",
  red: "from-red-500 to-rose-600 shadow-red-500/20",
  emerald: "from-emerald-500 to-green-600 shadow-emerald-500/20",
  blue: "from-blue-500 to-cyan-600 shadow-blue-500/20",
  purple: "from-purple-500 to-violet-600 shadow-purple-500/20",
}

export default function StatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5 hover:border-slate-600/50 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center shadow-lg`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  )
}
