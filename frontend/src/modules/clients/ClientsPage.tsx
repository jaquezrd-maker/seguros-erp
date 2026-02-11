import { Users, Mail, UserCheck, UserX, Clock } from "lucide-react"
import { useState, useEffect } from "react"
import useCrudModule from "../../hooks/useCrudModule"
import type { Client } from "../../types"
import { fmtDate } from "../../utils/format"
import StatusBadge from "../../components/ui/StatusBadge"
import DataTable from "../../components/ui/DataTable"
import SearchBar from "../../components/ui/SearchBar"
import StatCard from "../../components/ui/StatCard"
import Modal from "../../components/ui/Modal"
import FormInput from "../../components/ui/FormInput"
import ConfirmDialog from "../../components/ui/ConfirmDialog"
import ClientDetailModal from "./ClientDetailModal"
import { api } from "../../api/client"

interface ClientWithPortal extends Client {
  userId?: number | null
}

const defaultForm = {
  type: "FISICA", name: "", cedulaRnc: "", phone: "", email: "", address: "", city: "", province: "",
  contactPerson: "", contactPosition: "", purchasingManager: "", birthDate: "", notes: ""
}

export default function ClientsPage() {
  const crud = useCrudModule<ClientWithPortal>({ endpoint: "/clients", defaultForm })
  const [detailClientId, setDetailClientId] = useState<number | null>(null)
  const [rncLookupLoading, setRncLookupLoading] = useState(false)
  const [invitationTarget, setInvitationTarget] = useState<ClientWithPortal | null>(null)
  const [sendingInvitation, setSendingInvitation] = useState(false)
  const [invitationError, setInvitationError] = useState("")
  const [registrationUrl, setRegistrationUrl] = useState("")

  // Función para determinar el estado del portal
  const getPortalStatus = (client: ClientWithPortal) => {
    if (client.userId) return 'active'
    // Aquí podríamos verificar si hay una invitación pendiente
    // pero por simplicidad, si no tiene userId, asumimos que no tiene acceso
    return 'none'
  }

  // Renderizar badge de estado del portal
  const renderPortalBadge = (_: any, client: ClientWithPortal) => {
    const status = getPortalStatus(client)

    if (status === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium">
          <UserCheck size={12} />
          Acceso Activo
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-700/50 text-slate-400 text-xs font-medium">
        <UserX size={12} />
        Sin Acceso
      </span>
    )
  }

  // Renderizar acciones con botón de invitación
  const renderActions = (_: any, client: ClientWithPortal) => {
    const portalStatus = getPortalStatus(client)
    const canInvite = portalStatus === 'none' && client.email && client.status === 'ACTIVO'

    return (
      <div className="flex items-center justify-end gap-1">
        {canInvite && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setInvitationTarget(client)
              setInvitationError("")
            }}
            className="p-2 md:p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-colors"
            title="Enviar invitación al portal"
          >
            <Mail size={15} />
          </button>
        )}
        <button
          onClick={() => handleViewClient(client)}
          className="p-2 md:p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-teal-400 transition-colors"
          title="Ver detalles"
        >
          <Users size={15} />
        </button>
        <button
          onClick={() => crud.openEdit(client)}
          className="p-2 md:p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-indigo-400 transition-colors"
          title="Editar"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button
          onClick={() => crud.askDelete(client)}
          className="p-2 md:p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"
          title="Eliminar"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    )
  }

  const columns = [
    { key: "name", label: "Cliente" },
    { key: "cedulaRnc", label: "Cédula/RNC" },
    { key: "type", label: "Tipo", render: (v: string) => v === "FISICA" ? "Persona Física" : "Jurídica" },
    { key: "phone", label: "Teléfono", render: (v: string) => v || "—" },
    { key: "email", label: "Email", render: (v: string) => v || "—" },
    { key: "status", label: "Estado", render: (v: string) => <StatusBadge status={v} /> },
    { key: "userId", label: "Portal", render: renderPortalBadge },
    { key: "createdAt", label: "Registro", render: (v: string) => fmtDate(v) },
    { key: "actions", label: "Acciones", render: renderActions },
  ]

  const handleRNCLookup = async () => {
    const rnc = crud.form.cedulaRnc?.trim()
    if (!rnc || rnc.length < 9 || crud.modal !== "create") return

    setRncLookupLoading(true)
    try {
      const response = await api.get<{ success: boolean; data: any }>(`/clients/rnc/${rnc}`)
      if (response.success && response.data) {
        const rncData = response.data

        // Auto-fill form with RNC data
        crud.updateField("name", rncData.name || "")

        // Determine client type based on RNC length (11 = Jurídica, else Física)
        const type = rnc.length === 11 ? "JURIDICA" : "FISICA"
        crud.updateField("type", type)

        // Show success message
        console.log("RNC encontrado:", rncData)
      }
    } catch (error: any) {
      // Silently fail if RNC not found - user can still fill manually
      console.log("RNC no encontrado en DGII, continuar manualmente")
    } finally {
      setRncLookupLoading(false)
    }
  }

  const handleSave = async () => {
    if (crud.modal === "create") await crud.createItem()
    else if (crud.modal === "edit" && crud.selected) await crud.updateItem(crud.selected.id)
  }

  const handleViewClient = (client: ClientWithPortal) => {
    setDetailClientId(client.id)
  }

  const handleChangeStatus = async (client: ClientWithPortal, newStatus: string) => {
    await crud.patchItem(client.id, "status", { status: newStatus })
  }

  const handleSendInvitation = async () => {
    if (!invitationTarget) return

    setSendingInvitation(true)
    setInvitationError("")

    try {
      const response = await api.post<{ success: boolean; data: { registrationUrl: string }; message: string }>(`/client-portal/invitations/${invitationTarget.id}`, {})

      // Guardar el URL de registro
      setRegistrationUrl(response.data.registrationUrl)

      // Refrescar la lista de clientes
      crud.fetchItems()

      // NO cerrar modal, mostrar el link en su lugar
      // setInvitationTarget(null)
    } catch (error: any) {
      console.error('Error sending invitation:', error)
      setInvitationError(error.message || 'Error enviando la invitación')
    } finally {
      setSendingInvitation(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('¡Enlace copiado al portapapeles!')
    })
  }

  const activeCount = crud.items.filter(c => c.status === "ACTIVO").length

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Clientes" value={crud.total} icon={Users} color="teal" />
        <StatCard title="Activos" value={activeCount} icon={Users} color="emerald" />
        <StatCard title="Inactivos" value={crud.total - activeCount} icon={Users} color="red" />
      </div>

      <SearchBar value={crud.search} onChange={crud.setSearch} placeholder="Buscar cliente..." onAdd={crud.openNew} addLabel="Nuevo Cliente" />

      {crud.error && <div className="bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl p-3 mb-4 text-sm">{crud.error}</div>}

      <DataTable
        columns={columns}
        data={crud.items}
        loading={crud.loading}
        actions={false} // Desactivar acciones por defecto, usamos columna custom
      />

      {detailClientId && (
        <ClientDetailModal clientId={detailClientId} onClose={() => setDetailClientId(null)} />
      )}

      {/* Modal de invitación */}
      <Modal
        isOpen={!!invitationTarget}
        onClose={() => {
          setInvitationTarget(null)
          setInvitationError("")
          setRegistrationUrl("")
        }}
        title={registrationUrl ? "Invitación Creada" : "Enviar Invitación al Portal"}
        size="md"
      >
        <div className="space-y-4">
          {registrationUrl ? (
            // Mostrar link de registro
            <>
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <Mail size={20} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-400 mb-1">¡Invitación Creada Exitosamente!</p>
                    <p className="text-xs text-green-400/80">
                      Copia el siguiente enlace y envíalo al cliente por email o WhatsApp. Expira en 48 horas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-400">Enlace de Registro</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={registrationUrl}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(registrationUrl)}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm transition-colors whitespace-nowrap"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl">
                <p className="text-xs text-slate-400 mb-2">Cliente:</p>
                <p className="text-sm text-white font-semibold">{invitationTarget?.name}</p>
                <p className="text-sm text-slate-400">{invitationTarget?.email}</p>
              </div>
            </>
          ) : (
            // Mostrar formulario de confirmación
            <>
              <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <Mail size={20} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-cyan-400 mb-1">Invitación al Portal de Clientes</p>
                    <p className="text-xs text-cyan-400/80">
                      Se generará un enlace de registro que expira en 48 horas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Cliente</p>
                  <p className="text-white font-semibold">{invitationTarget?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Correo Electrónico</p>
                  <p className="text-white font-semibold">{invitationTarget?.email}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl">
                <p className="text-xs text-slate-400">
                  El cliente podrá:
                </p>
                <ul className="mt-2 space-y-1 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-teal-400 rounded-full"></span>
                    Ver sus pólizas y descargar PDFs
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-teal-400 rounded-full"></span>
                    Consultar historial de pagos
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-teal-400 rounded-full"></span>
                    Ver renovaciones pendientes
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-teal-400 rounded-full"></span>
                    Reportar y ver reclamos
                  </li>
                </ul>
              </div>
            </>
          )}

          {invitationError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-sm text-red-400">{invitationError}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            {registrationUrl ? (
              <button
                onClick={() => {
                  setInvitationTarget(null)
                  setInvitationError("")
                  setRegistrationUrl("")
                }}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors"
              >
                Cerrar
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setInvitationTarget(null)
                    setInvitationError("")
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
                  disabled={sendingInvitation}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendInvitation}
                  disabled={sendingInvitation}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingInvitation ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </span>
                  ) : "Crear Invitación"}
                </button>
              </>
            )}
          </div>
        </div>
      </Modal>

      <Modal isOpen={crud.modal === "create" || crud.modal === "edit"} onClose={crud.closeModal}
        title={crud.modal === "create" ? "Nuevo Cliente" : "Editar Cliente"} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label="Tipo" type="select" value={crud.form.type} onChange={v => crud.updateField("type", v)} required
            options={[{ value: "FISICA", label: "Persona Física" }, { value: "JURIDICA", label: "Persona Jurídica" }]} />
          <FormInput label="Nombre" value={crud.form.name} onChange={v => crud.updateField("name", v)} required />
          <FormInput label="Cédula / RNC" value={crud.form.cedulaRnc} onChange={v => crud.updateField("cedulaRnc", v)} onBlur={handleRNCLookup} required
            placeholder={rncLookupLoading ? "Buscando en DGII..." : "Ingrese cédula o RNC"} disabled={rncLookupLoading} />
          <FormInput label="Teléfono" value={crud.form.phone} onChange={v => crud.updateField("phone", v)} />
          <FormInput label="Email" type="email" value={crud.form.email} onChange={v => crud.updateField("email", v)} />
          <FormInput label="Dirección" value={crud.form.address} onChange={v => crud.updateField("address", v)} />
          <FormInput label="Ciudad" value={crud.form.city} onChange={v => crud.updateField("city", v)} />
          <FormInput label="Provincia" value={crud.form.province} onChange={v => crud.updateField("province", v)} />
          <FormInput label="Persona de Contacto" value={crud.form.contactPerson} onChange={v => crud.updateField("contactPerson", v)} />
          <FormInput label="Cargo/Puesto" value={crud.form.contactPosition} onChange={v => crud.updateField("contactPosition", v)} />
          <FormInput label="Encargado de Compras" value={crud.form.purchasingManager} onChange={v => crud.updateField("purchasingManager", v)} />
          <FormInput label="Fecha de Cumpleaños" type="date" value={crud.form.birthDate} onChange={v => crud.updateField("birthDate", v)} />
          <div className="md:col-span-2">
            <FormInput label="Notas" type="textarea" value={crud.form.notes} onChange={v => crud.updateField("notes", v)} />
          </div>
        </div>
        {crud.error && <div className="bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl p-3 mt-4 text-sm">{crud.error}</div>}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={crud.closeModal} className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={crud.saving}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {crud.saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!crud.deleteTarget} title="Eliminar Cliente"
        message={`¿Está seguro de eliminar al cliente "${crud.deleteTarget?.name}"?`}
        onConfirm={crud.deleteItem} onCancel={crud.cancelDelete} loading={crud.saving} />
    </div>
  )
}
