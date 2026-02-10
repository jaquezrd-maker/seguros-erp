import { useState, useEffect } from 'react'
import { X, Edit2, Trash2, Calendar as CalendarIcon, Clock, FileText } from 'lucide-react'
import { api } from '../../api/client'
import { fmtDate } from '../../utils/format'

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay?: boolean
  type: string
  color?: string
  description?: string
  entityType?: 'event' | 'policy' | 'payment'
  entityId?: number
  policyNumber?: string
  clientName?: string
}

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit' | 'view'
  event: CalendarEvent | null
  selectedSlot: { start: Date; end: Date } | null
  onEdit: () => void
  onSave: () => void
  onDelete: () => void
}

const eventTypes = [
  { value: 'REMINDER', label: 'Recordatorio', color: '#8b5cf6' },
  { value: 'MEETING', label: 'Reunión', color: '#10b981' },
  { value: 'FOLLOW_UP', label: 'Seguimiento', color: '#06b6d4' },
  { value: 'OTHER', label: 'Otro', color: '#3b82f6' },
]

export default function EventModal({
  isOpen,
  onClose,
  mode,
  event,
  selectedSlot,
  onEdit,
  onSave,
  onDelete,
}: EventModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    allDay: false,
    type: 'REMINDER',
    color: '#8b5cf6',
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (mode === 'create' && selectedSlot) {
      const start = selectedSlot.start
      const end = selectedSlot.end

      setFormData({
        title: '',
        description: '',
        startDate: start.toISOString().split('T')[0],
        startTime: start.toTimeString().slice(0, 5),
        endDate: end.toISOString().split('T')[0],
        endTime: end.toTimeString().slice(0, 5),
        allDay: false,
        type: 'REMINDER',
        color: '#8b5cf6',
      })
    } else if ((mode === 'edit' || mode === 'view') && event && event.entityType === 'event') {
      setFormData({
        title: event.title,
        description: event.description || '',
        startDate: event.start.toISOString().split('T')[0],
        startTime: event.start.toTimeString().slice(0, 5),
        endDate: event.end.toISOString().split('T')[0],
        endTime: event.end.toTimeString().slice(0, 5),
        allDay: event.allDay || false,
        type: event.type,
        color: event.color || '#8b5cf6',
      })
    }
  }, [mode, event, selectedSlot])

  const handleSave = async () => {
    setSaving(true)
    try {
      const startDateTime = formData.allDay
        ? new Date(formData.startDate)
        : new Date(`${formData.startDate}T${formData.startTime}`)

      const endDateTime = formData.allDay
        ? new Date(formData.endDate)
        : new Date(`${formData.endDate}T${formData.endTime}`)

      const payload = {
        title: formData.title,
        description: formData.description,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        allDay: formData.allDay,
        type: formData.type,
        color: formData.color,
      }

      if (mode === 'create') {
        await api.post('/events', payload)
      } else if (mode === 'edit' && event) {
        const eventId = event.id.replace('event-', '')
        await api.put(`/events/${eventId}`, payload)
      }

      onSave()
    } catch (error) {
      console.error('Error saving event:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!event) return

    setDeleting(true)
    try {
      const eventId = event.id.replace('event-', '')
      await api.delete(`/events/${eventId}`)
      onDelete()
    } catch (error) {
      console.error('Error deleting event:', error)
    } finally {
      setDeleting(false)
    }
  }

  const handleTypeChange = (type: string) => {
    const selectedType = eventTypes.find((t) => t.value === type)
    setFormData({
      ...formData,
      type,
      color: selectedType?.color || formData.color,
    })
  }

  if (!isOpen) return null

  // View mode for non-editable events (policy expirations, payments)
  if (mode === 'view' && event && event.entityType !== 'event') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 max-w-md w-full">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">{event.title}</h3>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-700 text-slate-400">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <CalendarIcon size={16} className="text-slate-400" />
              <span>{fmtDate(event.start.toISOString())}</span>
            </div>

            {event.description && (
              <div className="flex items-start gap-2 text-slate-300">
                <FileText size={16} className="text-slate-400 mt-0.5" />
                <span>{event.description}</span>
              </div>
            )}

            {event.clientName && (
              <div className="text-slate-300">
                <span className="text-slate-400">Cliente:</span> {event.clientName}
              </div>
            )}

            {event.policyNumber && (
              <div className="text-slate-300">
                <span className="text-slate-400">Póliza:</span> {event.policyNumber}
              </div>
            )}

            <div className="pt-3 border-t border-slate-700">
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: event.color + '20', color: event.color }}
              >
                {event.type === 'POLICY_EXPIRATION' && 'Vencimiento de Póliza'}
                {event.type === 'PAYMENT_DUE' && 'Pago Pendiente'}
                {event.type === 'RENEWAL_DUE' && 'Renovación Pendiente'}
              </span>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // View mode for custom events
  if (mode === 'view' && event && event.entityType === 'event') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 max-w-md w-full">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">{event.title}</h3>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-700 text-slate-400">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <CalendarIcon size={16} className="text-slate-400" />
              <span>
                {fmtDate(event.start.toISOString())}
                {!event.allDay && ` ${event.start.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`}
              </span>
            </div>

            {event.description && (
              <div className="flex items-start gap-2 text-slate-300">
                <FileText size={16} className="text-slate-400 mt-0.5" />
                <span>{event.description}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-700">
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: event.color + '20', color: event.color }}
              >
                {eventTypes.find((t) => t.value === event.type)?.label || event.type}
              </span>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <div className="flex gap-2">
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors"
              >
                <Edit2 size={16} />
                Editar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm transition-colors disabled:opacity-50"
              >
                <Trash2 size={16} />
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Create/Edit mode
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 max-w-md w-full">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            {mode === 'create' ? 'Nuevo Evento' : 'Editar Evento'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-700 text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Título *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Reunión con cliente"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Tipo</label>
            <select
              value={formData.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {eventTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detalles del evento..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={formData.allDay}
              onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="allDay" className="text-sm text-slate-300">
              Todo el día
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Fecha Inicio</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {!formData.allDay && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Hora</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Fecha Fin</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {!formData.allDay && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Hora</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.title}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
