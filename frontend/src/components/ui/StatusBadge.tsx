const statusMap: Record<string, string> = {
  activo: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  vigente: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  activa: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  completado: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  aprobado: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  pagada: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  pagado: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  procesada: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  pendiente: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  en_proceso: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  en_revision: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  en_renovacion: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  trial: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  suspendido: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  inactivo: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  inactiva: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  bloqueado: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  vencida: "bg-red-500/15 text-red-400 border-red-500/30",
  vencido: "bg-red-500/15 text-red-400 border-red-500/30",
  cancelado: "bg-red-500/15 text-red-400 border-red-500/30",
  cancelada: "bg-red-500/15 text-red-400 border-red-500/30",
  anulado: "bg-red-500/15 text-red-400 border-red-500/30",
  anulada: "bg-red-500/15 text-red-400 border-red-500/30",
  rechazado: "bg-red-500/15 text-red-400 border-red-500/30",
  rechazada: "bg-red-500/15 text-red-400 border-red-500/30",
  alta: "bg-red-500/15 text-red-400 border-red-500/30",
  critica: "bg-red-500/15 text-red-400 border-red-500/30",
  media: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  baja: "bg-blue-500/15 text-blue-400 border-blue-500/30",
}

export default function StatusBadge({ status }: { status: string }) {
  if (!status) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize bg-slate-500/15 text-slate-400 border-slate-500/30">
        desconocido
      </span>
    )
  }

  const key = status.toLowerCase().replace(/ /g, "_")
  const label = key.replace(/_/g, " ")
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${statusMap[key] || "bg-slate-500/15 text-slate-400 border-slate-500/30"}`}>
      {label}
    </span>
  )
}
