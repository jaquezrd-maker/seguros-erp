import { useState, useEffect, useCallback } from 'react'
import { Calendar as BigCalendar, dateFnsLocalizer, Views, type View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addMonths, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { api } from '../../api/client'
import EventModal from './EventModal'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './calendar.css'

const locales = { 'es': es }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

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

interface CalendarProps {
  onEventClick?: (event: CalendarEvent) => void
}

export default function Calendar({ onEventClick }: CalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<View>(Views.MONTH)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view')
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)

  const fetchEvents = useCallback(async (date: Date) => {
    setLoading(true)
    try {
      const start = startOfMonth(date)
      const end = endOfMonth(addMonths(date, 1))

      const response = await api.get<{ success: boolean; data: any[] }>(
        `/events/calendar?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      )

      const formattedEvents = response.data.map((e: any) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
      }))

      setEvents(formattedEvents)
    } catch (error) {
      console.error('Error fetching calendar events:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents(currentDate)
  }, [currentDate, fetchEvents])

  const handleNavigate = (date: Date) => {
    setCurrentDate(date)
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    if (event.entityType === 'event') {
      setSelectedEvent(event)
      setModalMode('view')
      setModalOpen(true)
    }
    if (onEventClick) {
      onEventClick(event)
    }
  }

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setSelectedSlot(slotInfo)
    setSelectedEvent(null)
    setModalMode('create')
    setModalOpen(true)
  }

  const handleEditEvent = () => {
    setModalMode('edit')
  }

  const handleSaveEvent = async () => {
    await fetchEvents(currentDate)
    setModalOpen(false)
    setSelectedEvent(null)
    setSelectedSlot(null)
  }

  const handleDeleteEvent = async () => {
    await fetchEvents(currentDate)
    setModalOpen(false)
    setSelectedEvent(null)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedEvent(null)
    setSelectedSlot(null)
  }

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = event.color || '#3b82f6'

    // Default colors by type
    if (!event.color) {
      switch (event.type) {
        case 'POLICY_EXPIRATION':
          backgroundColor = '#ef4444'
          break
        case 'PAYMENT_DUE':
          backgroundColor = '#f59e0b'
          break
        case 'REMINDER':
          backgroundColor = '#8b5cf6'
          break
        case 'MEETING':
          backgroundColor = '#10b981'
          break
        case 'FOLLOW_UP':
          backgroundColor = '#06b6d4'
          break
        default:
          backgroundColor = '#3b82f6'
      }
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    }
  }

  if (loading && events.length === 0) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-slate-800/50 rounded-2xl border border-slate-700">
        <div className="text-slate-400">Cargando calendario...</div>
      </div>
    )
  }

  return (
    <div className="calendar-container">
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        onNavigate={handleNavigate}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        onView={setView}
        view={view}
        selectable
        eventPropGetter={eventStyleGetter}
        messages={{
          next: 'Siguiente',
          previous: 'Anterior',
          today: 'Hoy',
          month: 'Mes',
          week: 'Semana',
          day: 'Día',
          agenda: 'Agenda',
          date: 'Fecha',
          time: 'Hora',
          event: 'Evento',
          noEventsInRange: 'No hay eventos en este rango',
          showMore: (total) => `+ Ver más (${total})`,
        }}
        culture="es"
      />

      <EventModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        event={selectedEvent}
        selectedSlot={selectedSlot}
        onEdit={handleEditEvent}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  )
}
