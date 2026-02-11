import { useState, useEffect } from "react"
import { Plus, Check, X, Trash2, Calendar, AlertCircle, Edit2 } from "lucide-react"
import { api } from "../../api/client"

interface Task {
  id: number
  title: string
  description?: string
  completed: boolean
  priority: "BAJA" | "MEDIA" | "ALTA" | "URGENTE"
  dueDate?: string
  createdAt: string
}

const priorityColors = {
  BAJA: "text-slate-400",
  MEDIA: "text-blue-400",
  ALTA: "text-amber-400",
  URGENTE: "text-red-400",
}

const priorityLabels = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  URGENTE: "Urgente",
}

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIA" as Task["priority"],
    dueDate: "",
  })

  const fetchTasks = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Task[] }>("/tasks")
      if (response.success) {
        setTasks(response.data)
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const createCalendarEvent = async (task: { title: string; description?: string; dueDate?: string }) => {
    if (!task.dueDate) return

    try {
      // For all-day events, set time to noon UTC to avoid timezone issues
      const dateAtNoonUTC = `${task.dueDate}T12:00:00.000Z`

      await api.post("/events", {
        title: `📋 ${task.title}`,
        description: task.description || "Tarea pendiente",
        startDate: dateAtNoonUTC,
        endDate: dateAtNoonUTC,
        allDay: true,
        type: "REMINDER",
        color: "#14b8a6",
      })
      console.log("Evento creado en el calendario")
    } catch (error) {
      console.error("Error creating calendar event:", error)
    }
  }

  const handleCreate = async () => {
    if (!form.title.trim()) return

    try {
      const taskData = {
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        dueDate: form.dueDate || null,
      }

      await api.post("/tasks", taskData)

      // Create calendar event if due date is set
      if (taskData.dueDate) {
        await createCalendarEvent(taskData)
        // Notify calendar to refresh
        window.dispatchEvent(new CustomEvent('refreshCalendar'))
      }

      setForm({ title: "", description: "", priority: "MEDIA", dueDate: "" })
      setShowForm(false)
      fetchTasks()
    } catch (error) {
      console.error("Error creating task:", error)
    }
  }

  const handleEdit = async () => {
    if (!editingTask || !form.title.trim()) return

    try {
      await api.put(`/tasks/${editingTask.id}`, {
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        dueDate: form.dueDate || null,
      })
      setForm({ title: "", description: "", priority: "MEDIA", dueDate: "" })
      setEditingTask(null)
      fetchTasks()
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const startEditing = (task: Task) => {
    setEditingTask(task)
    setForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
    })
    setShowForm(false)
  }

  const cancelEditing = () => {
    setEditingTask(null)
    setForm({ title: "", description: "", priority: "MEDIA", dueDate: "" })
  }

  const handleToggle = async (id: number) => {
    try {
      await api.patch(`/tasks/${id}/toggle`, {})
      fetchTasks()
    } catch (error) {
      console.error("Error toggling task:", error)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const task = tasks.find(t => t.id === id)

      // Delete the task
      await api.delete(`/tasks/${id}`)

      // Also delete associated calendar event if it exists
      if (task) {
        try {
          // Find calendar events with matching title pattern
          const eventsResponse = await api.get<{ success: boolean; data: any[] }>('/events')
          const associatedEvent = eventsResponse.data.find(
            (e: any) => e.title === `📋 ${task.title}` && e.type === 'REMINDER'
          )

          if (associatedEvent) {
            await api.delete(`/events/${associatedEvent.id}`)
            window.dispatchEvent(new CustomEvent('refreshCalendar'))
          }
        } catch (error) {
          console.warn("Could not delete associated calendar event:", error)
        }
      }

      fetchTasks()
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  const pendingTasks = tasks.filter((t) => !t.completed)
  const completedTasks = tasks.filter((t) => t.completed)

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-slate-700 rounded w-1/3" />
          <div className="h-10 bg-slate-700 rounded" />
          <div className="h-10 bg-slate-700 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Lista de Tareas</h3>
        <button
          onClick={() => {
            setShowForm(!showForm)
            if (editingTask) cancelEditing()
          }}
          className="p-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors"
        >
          {showForm || editingTask ? <X size={16} /> : <Plus size={16} />}
        </button>
      </div>

      {(showForm || editingTask) && (
        <div className="mb-4 p-3 bg-slate-700/50 rounded-xl space-y-2">
          {editingTask && (
            <div className="flex items-center gap-2 mb-2 text-xs text-teal-400">
              <Edit2 size={12} />
              <span>Editando tarea</span>
            </div>
          )}
          <input
            type="text"
            placeholder="Título de la tarea..."
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
          <textarea
            placeholder="Descripción (opcional)..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Task["priority"] })}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500"
            >
              <option value="BAJA">Baja</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500"
            />
          </div>
          <div className="flex gap-2">
            {editingTask && (
              <button
                onClick={cancelEditing}
                className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={editingTask ? handleEdit : handleCreate}
              disabled={!form.title.trim()}
              className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {editingTask ? "Guardar Cambios" : "Crear Tarea"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {/* Pending Tasks */}
        {pendingTasks.length === 0 && completedTasks.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">No hay tareas</p>
        ) : (
          <>
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors group"
              >
                <button
                  onClick={() => handleToggle(task.id)}
                  className="mt-0.5 w-5 h-5 rounded border-2 border-slate-500 hover:border-teal-500 flex items-center justify-center transition-colors flex-shrink-0"
                >
                  {task.completed && <Check size={14} className="text-teal-500" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-slate-400 mt-0.5">{task.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs ${priorityColors[task.priority]}`}>
                      <AlertCircle size={12} className="inline mr-1" />
                      {priorityLabels[task.priority]}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-slate-500">
                        <Calendar size={12} className="inline mr-1" />
                        {new Date(task.dueDate).toLocaleDateString("es-DO")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEditing(task)}
                    className="p-1 rounded hover:bg-teal-500/20 text-teal-400 transition-all flex-shrink-0"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-all flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <>
                {pendingTasks.length > 0 && (
                  <div className="border-t border-slate-700 my-3 pt-3">
                    <p className="text-xs text-slate-500 mb-2">Completadas ({completedTasks.length})</p>
                  </div>
                )}
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 bg-slate-700/20 rounded-lg border border-slate-700/30 opacity-60 group"
                  >
                    <button
                      onClick={() => handleToggle(task.id)}
                      className="mt-0.5 w-5 h-5 rounded border-2 border-teal-500 bg-teal-500 flex items-center justify-center flex-shrink-0"
                    >
                      <Check size={14} className="text-white" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-400 line-through">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-slate-500 line-through mt-0.5">{task.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-red-400 transition-all flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
