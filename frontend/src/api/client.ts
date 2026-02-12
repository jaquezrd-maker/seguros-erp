import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

// Fast session read from localStorage without async validation
function getSessionFromStorage(): string | null {
  try {
    const key = `sb-rqzmolpyqqajzzvbwtnd-auth-token`
    const item = localStorage.getItem(key)
    if (!item) return null

    const data = JSON.parse(item)
    return data?.access_token || null
  } catch {
    return null
  }
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  console.log('[API] Getting auth headers...')

  // Try fast localStorage read first
  const cachedToken = getSessionFromStorage()
  if (cachedToken) {
    console.log('[API] Using cached token from localStorage')
    const headers: Record<string, string> = {
      Authorization: `Bearer ${cachedToken}`,
    }

    const activeCompanyId = useAuthStore.getState().activeCompanyId
    if (activeCompanyId) {
      headers['X-Company-Id'] = activeCompanyId.toString()
    }

    return headers
  }

  // Fallback to async Supabase call with timeout
  try {
    console.log('[API] No cached token, calling supabase.auth.getSession()...')

    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('getSession timeout after 5s')), 5000)
    })

    const result = await Promise.race([
      sessionPromise,
      timeoutPromise
    ])

    console.log('[API] getSession completed')

    const { data: { session }, error } = result

    if (error) {
      console.error('[API] Error getting session:', error)
      return {}
    }

    if (!session?.access_token) {
      console.warn('[API] No session or access token found')
      return {}
    }

    console.log('[API] Session found, building headers...')

    const headers: Record<string, string> = {
      Authorization: `Bearer ${session.access_token}`,
    }

    const activeCompanyId = useAuthStore.getState().activeCompanyId
    console.log('[API] Active company ID from store:', activeCompanyId)

    if (activeCompanyId) {
      headers['X-Company-Id'] = activeCompanyId.toString()
    }

    console.log('[API] Auth headers ready')
    return headers
  } catch (error) {
    console.error('[API] Unexpected error in getAuthHeaders:', error)
    return {}
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  console.log('[API] request() called for path:', path)

  console.log('[API] About to get auth headers...')
  const authHeaders = await getAuthHeaders()
  console.log('[API] Got auth headers, building request...')

  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders,
    ...options.headers,
  }

  console.log('[API] Making fetch request to:', `${API_BASE}${path}`)
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  console.log('[API] Fetch completed with status:', res.status)

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
