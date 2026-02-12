import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { api } from '../api/client'
import { useAuthStore, type AuthUser, type CompanyAccess } from '../store/authStore'

interface DBUser {
  id: number
  name: string
  email: string
  role: string
  status: string
  forcePasswordChange: boolean
  globalRole?: string
  companyId?: number
  companies?: CompanyAccess[]
}

interface AuthState {
  user: User | null
  session: Session | null
  dbUser: DBUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshDbUser: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [dbUser, setDbUser] = useState<DBUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Timeout de seguridad: si después de 10 segundos sigue loading, forzar a false
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('[AUTH] Loading timeout alcanzado, forzando a false')
        setLoading(false)
      }
    }, 10000) // 10 segundos

    return () => clearTimeout(timeout)
  }, [loading])

  const fetchDbUser = async () => {
    try {
      const response = await api.get<{ success: boolean; data: DBUser }>('/auth/me')
      const dbUserData = response.data
      setDbUser(dbUserData)

      // Sync with authStore for multi-tenant context
      if (dbUserData) {
        const authUser: AuthUser = {
          id: dbUserData.id,
          email: dbUserData.email,
          name: dbUserData.name,
          role: dbUserData.role,
          globalRole: dbUserData.globalRole || dbUserData.role,
          supabaseUserId: user?.id || '',
          companyId: dbUserData.companyId,
          companies: dbUserData.companies || [],
        }

        // CRITICAL: Always use the companyId from backend, not from localStorage
        // This ensures the activeCompanyId is always in sync after company switches
        const store = useAuthStore.getState()
        store.setUser(authUser)

        // Force update activeCompanyId from backend
        if (dbUserData.companyId !== store.activeCompanyId) {
          console.log(`[AUTH] Syncing companyId: ${store.activeCompanyId} -> ${dbUserData.companyId}`)
          store.setActiveCompany(dbUserData.companyId || 0)
        }
      }
    } catch (error: any) {
      console.error('Error fetching database user:', error)
      setDbUser(null)
      useAuthStore.getState().logout()

      // Si el error es 401 (token inválido/expirado), limpiar la sesión de Supabase
      if (error?.status === 401 || error?.response?.status === 401) {
        console.log('[AUTH] Token inválido detectado, limpiando sesión...')
        await supabase.auth.signOut()
        setUser(null)
        setSession(null)
      }
    }
  }

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      // Si hay error al obtener la sesión, limpiar todo
      if (error) {
        console.error('[AUTH] Error getting session:', error)
        await supabase.auth.signOut()
        setSession(null)
        setUser(null)
        setDbUser(null)
        setLoading(false)
        return
      }

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchDbUser()
      }

      setLoading(false)
    }).catch(async (error) => {
      // Capturar cualquier error no manejado
      console.error('[AUTH] Unexpected error during initialization:', error)
      await supabase.auth.signOut()
      setSession(null)
      setUser(null)
      setDbUser(null)
      setLoading(false)
    })

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[AUTH] Auth state changed:', _event)

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchDbUser()
      } else {
        setDbUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await fetchDbUser()
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setDbUser(null)
    useAuthStore.getState().logout()
  }

  const refreshDbUser = async () => {
    await fetchDbUser()
  }

  return (
    <AuthContext.Provider value={{ user, session, dbUser, loading, signIn, signOut, refreshDbUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
