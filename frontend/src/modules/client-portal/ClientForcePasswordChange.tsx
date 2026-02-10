import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Shield, Lock, AlertCircle, AlertTriangle } from 'lucide-react'
import { api } from '../../api/client'

export default function ClientForcePasswordChange() {
  const navigate = useNavigate()
  const { refreshDbUser } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validar que las contraseñas coincidan
    if (newPassword !== confirmNewPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    // Validar que la nueva contraseña sea diferente
    if (currentPassword === newPassword) {
      setError('La nueva contraseña debe ser diferente a la actual')
      return
    }

    // Validar fortaleza de contraseña
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError('La contraseña debe contener al menos una mayúscula')
      return
    }
    if (!/[a-z]/.test(newPassword)) {
      setError('La contraseña debe contener al menos una minúscula')
      return
    }
    if (!/[0-9]/.test(newPassword)) {
      setError('La contraseña debe contener al menos un número')
      return
    }

    setLoading(true)

    try {
      await api.post('/client-portal/change-password', {
        currentPassword,
        newPassword,
        confirmNewPassword
      })

      // Refrescar información del usuario
      await refreshDbUser()

      // Redirigir al dashboard
      navigate('/client/dashboard')
    } catch (err: any) {
      console.error('Password change error:', err)
      setError(err.message || 'Error cambiando la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 mb-4">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Cambio de Contraseña Requerido</h1>
          <p className="text-slate-400 text-sm">Portal de Clientes - SeguroPro</p>
        </div>

        {/* Formulario */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-2xl">
          {/* Alerta de seguridad */}
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-400 mb-1">Por tu seguridad</p>
              <p className="text-xs text-amber-400/80">
                Debes cambiar tu contraseña antes de acceder al portal por primera vez.
              </p>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-white mb-6">Establecer Nueva Contraseña</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Contraseña actual */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Contraseña Actual
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Nueva contraseña */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Confirmar nueva contraseña */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Requisitos de contraseña */}
            <div className="text-xs text-slate-400 space-y-1">
              <p className="font-medium">La contraseña debe contener:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Al menos 8 caracteres</li>
                <li>Una letra mayúscula</li>
                <li>Una letra minúscula</li>
                <li>Un número</li>
                <li>Ser diferente a la contraseña actual</li>
              </ul>
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 disabled:from-slate-700 disabled:to-slate-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-teal-500/20 disabled:shadow-none"
            >
              {loading ? 'Cambiando contraseña...' : 'Cambiar Contraseña'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          © {new Date().getFullYear()} SeguroPro. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}
