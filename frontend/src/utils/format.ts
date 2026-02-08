export const fmt = (n: number) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", minimumFractionDigits: 0 }).format(n)

export const fmtDate = (d: string | null | undefined) => {
  if (!d) return "—"
  const dateStr = d.includes("T") ? d.split("T")[0] : d
  const dt = new Date(dateStr + "T12:00:00")
  return dt.toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" })
}

/** Extract YYYY-MM-DD from an ISO datetime string (for date inputs) */
export const toDateInput = (d: string | null | undefined) => {
  if (!d) return ""
  return d.includes("T") ? d.split("T")[0] : d
}
