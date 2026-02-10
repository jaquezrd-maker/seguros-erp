import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface ClientProtectedRouteProps {
  children: React.ReactNode
}

export default function ClientProtectedRoute({ children }: ClientProtectedRouteProps) {
  const { user, loading, dbUser } = useAuth()
  const location = useLocation()

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario autenticado, redirigir a login de cliente
  if (!user) {
    return <Navigate to="/client/login" replace state={{ from: location }} />
  }

  // Si no hay dbUser aún, esperar
  if (!dbUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  // Verificar que el usuario tiene rol CLIENTE
  if (dbUser.role !== 'CLIENTE') {
    return <Navigate to="/login" replace />
  }

  // Si el cliente debe cambiar su contraseña y no está en la página de cambio
  if (dbUser.forcePasswordChange && location.pathname !== '/client/change-password') {
    return <Navigate to="/client/change-password" replace />
  }

  // Usuario autenticado como cliente, permitir acceso
  return <>{children}</>
}
