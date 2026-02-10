import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Shield, Lock, AlertCircle, CheckCircle, User } from 'lucide-react'
import { api } from '../../api/client'

export default function ClientRegistration() {
  const navigate = useNavigate()
  const { token } = useParams<{ token: string }>()
  const [clientName, setClientName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)

  // Validar token al cargar
  useEffect(() => {
    if (!token) {
      setError('Token de invitación no proporcionado')
      setValidating(false)
      return
    }

    const validateToken = async () => {
      try {
        const response = await api.get<{ success: boolean; data: { clientName: string; email: string } }>(
          `/client-portal/validate/${token}`
        )
        setClientName(response.data.clientName)
        setEmail(response.data.email)
        setTokenValid(true)
      } catch (err: any) {
        setError(err.message || 'Token de invitación inválido o expirado')
        setTokenValid(false)
      } finally {
        setValidating(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    // Validar fortaleza de contraseña
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (!/[A-Z]/.test(password)) {
      setError('La contraseña debe contener al menos una mayúscula')
      return
    }
    if (!/[a-z]/.test(password)) {
      setError('La contraseña debe contener al menos una minúscula')
      return
    }
    if (!/[0-9]/.test(password)) {
      setError('La contraseña debe contener al menos un número')
      return
    }

    setLoading(true)

    try {
      await api.post('/client-portal/register', {
        token,
        password,
        confirmPassword
      })

      // Mostrar mensaje de éxito y redirigir
      alert('Registro completado exitosamente. Ahora puede iniciar sesión.')
      navigate('/client/login')
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Error completando el registro')
    } finally {
      setLoading(false)
    }
  }

  // Mostrar loading mientras valida el token
  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Validando invitación...</p>
        </div>
      </div>
    )
  }

  // Si el token no es válido, mostrar error
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-8 shadow-2xl">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 mb-4">
                <AlertCircle size={32} className="text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Token Inválido</h2>
              <p className="text-slate-400 mb-6">{error}</p>
              <button
                onClick={() => navigate('/client/login')}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
              >
                Ir a Iniciar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 mb-4">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Completar Registro</h1>
          <p className="text-slate-400 text-sm">Portal de Clientes - SeguroPro</p>
        </div>

        {/* Formulario de registro */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-2xl">
          {/* Información del cliente */}
          <div className="mb-6 p-4 bg-teal-500/10 border border-teal-500/30 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <User size={18} className="text-teal-400" />
              <p className="text-sm font-medium text-teal-400">Información del Cliente</p>
            </div>
            <p className="text-white font-semibold">{clientName}</p>
            <p className="text-slate-400 text-sm">{email}</p>
          </div>

          <h2 className="text-xl font-semibold text-white mb-6">Establecer Contraseña</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              </ul>
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 disabled:from-slate-700 disabled:to-slate-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-teal-500/20 disabled:shadow-none"
            >
              {loading ? 'Completando registro...' : 'Completar Registro'}
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
