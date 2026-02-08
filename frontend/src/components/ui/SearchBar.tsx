import { Search, Plus } from "lucide-react"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onAdd?: () => void
  addLabel?: string
}

export default function SearchBar({ value, onChange, placeholder = "Buscar...", onAdd, addLabel = "Nuevo" }: SearchBarProps) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all" />
      </div>
      {onAdd && (
        <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors shadow-lg shadow-teal-500/20">
          <Plus size={16} /><span className="hidden sm:inline">{addLabel}</span>
        </button>
      )}
    </div>
  )
}
