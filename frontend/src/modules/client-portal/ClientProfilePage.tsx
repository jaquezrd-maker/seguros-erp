import { useState, useEffect } from "react"
import { User, Mail, Phone, MapPin, Lock, AlertCircle } from "lucide-react"
import { api } from "../../api/client"
import { useAuth } from "../../context/AuthContext"

interface ClientProfile {
  id: number
  name: string
  email: string
  phone?: string
  phoneAlt?: string
  address?: string
  city?: string
  province?: string
  type: string
  cedulaRnc: string
}

export default function ClientProfilePage() {
  const { refreshDbUser } = useAuth()
  const [profile, setProfile] = useState<ClientProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get<{ success: boolean; data: ClientProfile }>('/client-portal-data/profile')
        setProfile(response.data)
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")
    setPasswordSuccess(false)

    // Validaciones
    if (newPassword !== confirmNewPassword) {
      setPasswordError("Las contraseñas no coinciden")
      return
    }

    if (currentPassword === newPassword) {
      setPasswordError("La nueva contraseña debe ser diferente a la actual")
      return
    }

    if (newPassword.length < 8) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPasswordError("La contraseña debe contener mayúsculas, minúsculas y números")
      return
    }

    setPasswordLoading(true)

    try {
      await api.post('/client-portal/change-password', {
        currentPassword,
        newPassword,
        confirmNewPassword
      })

      await refreshDbUser()

      setPasswordSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmNewPassword("")
      setShowPasswordForm(false)

      setTimeout(() => setPasswordSuccess(false), 5000)
    } catch (error: any) {
      setPasswordError(error.message || "Error cambiando la contraseña")
    } finally {
      setPasswordLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No se pudo cargar la información del perfil</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Mi Perfil</h1>
        <p className="text-slate-400">Información personal y configuración de cuenta</p>
      </div>

      {/* Información Personal */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
            <User size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Información Personal</h2>
            <p className="text-sm text-slate-400">Datos de tu cuenta</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Nombre Completo</label>
            <p className="text-white font-medium">{profile.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Tipo</label>
            <p className="text-white font-medium">
              {profile.type === 'FISICA' ? 'Persona Física' : 'Persona Jurídica'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Cédula/RNC</label>
            <p className="text-white font-medium">{profile.cedulaRnc}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
              <Mail size={16} />
              Correo Electrónico
            </label>
            <p className="text-white font-medium">{profile.email}</p>
          </div>

          {profile.phone && (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <Phone size={16} />
                Teléfono Principal
              </label>
              <p className="text-white font-medium">{profile.phone}</p>
            </div>
          )}

          {profile.phoneAlt && (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <Phone size={16} />
                Teléfono Alternativo
              </label>
              <p className="text-white font-medium">{profile.phoneAlt}</p>
            </div>
          )}

          {profile.address && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <MapPin size={16} />
                Dirección
              </label>
              <p className="text-white font-medium">{profile.address}</p>
              {(profile.city || profile.province) && (
                <p className="text-slate-400 text-sm mt-1">
                  {[profile.city, profile.province].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Seguridad */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Lock size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Seguridad</h2>
            <p className="text-sm text-slate-400">Gestiona la seguridad de tu cuenta</p>
          </div>
        </div>

        {passwordSuccess && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3">
            <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-emerald-400">Contraseña actualizada exitosamente</p>
          </div>
        )}

        {!showPasswordForm ? (
          <button
            onClick={() => setShowPasswordForm(true)}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium transition-colors"
          >
            Cambiar Contraseña
          </button>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordError && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-400">{passwordError}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Contraseña Actual
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                placeholder="••••••••"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false)
                  setPasswordError("")
                  setCurrentPassword("")
                  setNewPassword("")
                  setConfirmNewPassword("")
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
                disabled={passwordLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={passwordLoading}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordLoading ? "Cambiando..." : "Guardar Nueva Contraseña"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
