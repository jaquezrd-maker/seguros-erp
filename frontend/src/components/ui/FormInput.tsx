interface FormInputProps {
  label: string
  type?: string
  value: string | number | null | undefined
  onChange: (value: string) => void
  options?: Array<string | { value: string | number; label: string }>
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

export default function FormInput({ label, type = "text", value: rawValue, onChange, options, placeholder, required, disabled }: FormInputProps) {
  let value: string | number = rawValue ?? ""
  // Normalize ISO datetime to YYYY-MM-DD for date inputs
  if (type === "date" && typeof value === "string" && value.includes("T")) {
    value = value.split("T")[0]
  }
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      {type === "select" ? (
        <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
          className="w-full px-3 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-teal-500 transition-all disabled:opacity-50">
          <option value="">Seleccionar...</option>
          {options?.map((o, i) => {
            const val = typeof o === "object" ? o.value : o
            const lab = typeof o === "object" ? o.label : o
            return <option key={i} value={val}>{lab}</option>
          })}
        </select>
      ) : type === "textarea" ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} disabled={disabled}
          className="w-full px-3 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-teal-500 transition-all resize-none disabled:opacity-50" />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
          className="w-full px-3 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-all disabled:opacity-50" />
      )}
    </div>
  )
}
