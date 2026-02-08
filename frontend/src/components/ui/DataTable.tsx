import { Eye, Edit, Trash2 } from "lucide-react"

export interface Column<T> {
  key: string
  label: string
  render?: (value: any, row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  onView?: (row: T) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  actions?: boolean
  loading?: boolean
}

export default function DataTable<T extends Record<string, any>>({ columns, data, onView, onEdit, onDelete, actions = true, loading = false }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-800/50">
            {columns.map((col, i) => (
              <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{col.label}</th>
            ))}
            {actions && <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Acciones</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/30">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((_, ci) => (
                  <td key={ci} className="px-4 py-3"><div className="h-4 bg-slate-700/50 rounded animate-pulse" /></td>
                ))}
                {actions && <td className="px-4 py-3"><div className="h-4 bg-slate-700/50 rounded animate-pulse w-20 ml-auto" /></td>}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-12 text-center text-slate-500">
                No se encontraron registros
              </td>
            </tr>
          ) : (
            data.map((row, ri) => (
              <tr key={ri} className="hover:bg-slate-800/30 transition-colors">
                {columns.map((col, ci) => (
                  <td key={ci} className="px-4 py-3 text-slate-300 whitespace-nowrap">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onView && <button onClick={() => onView(row)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-teal-400 transition-colors"><Eye size={15} /></button>}
                      {onEdit && <button onClick={() => onEdit(row)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-indigo-400 transition-colors"><Edit size={15} /></button>}
                      {onDelete && <button onClick={() => onDelete(row)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={15} /></button>}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
