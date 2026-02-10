import { supabase } from '../lib/supabase'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return {}
  return { Authorization: `Bearer ${session.access_token}` }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(await getAuthHeaders()),
    ...options.headers,
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await res.json()

  if (!res.ok) {
    // Si hay errores de validación, construir mensaje detallado
    let errorMessage = data.message || 'Error en la solicitud'

    if (data.errors && Array.isArray(data.errors)) {
      // Extraer solo los mensajes de error, sin el nombre del campo
      const validationErrors = data.errors
        .map((err: any) => err.message)
        .join('. ')
      errorMessage = validationErrors || errorMessage
    }

    // Si es error 401 (no autorizado), limpiar la sesión de Supabase
    if (res.status === 401) {
      console.log('[API] Error 401 detectado, limpiando sesión...')
      // Limpiar sesión de Supabase (esto limpia localStorage automáticamente)
      supabase.auth.signOut().catch(console.error)
    }

    const error: any = new Error(errorMessage)
    error.status = res.status
    error.response = { status: res.status, data }
    throw error
  }

  return data
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
