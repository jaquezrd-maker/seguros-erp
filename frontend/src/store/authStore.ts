import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CompanyAccess {
  id: number
  name: string
  slug: string
  role: string
  status?: string
}

export interface AuthUser {
  id: number
  email: string
  name: string
  role: string // Role in active company
  globalRole: string // Global role (SUPER_ADMIN, etc.)
  supabaseUserId: string
  companyId?: number
  companies: CompanyAccess[]
}

interface AuthState {
  user: AuthUser | null
  activeCompanyId: number | null
  setUser: (user: AuthUser | null) => void
  setActiveCompany: (companyId: number) => void
  getActiveCompany: () => CompanyAccess | null
  logout: () => void
}

/**
 * Auth Store
 * Manages authentication state and active company context
 * Persists to localStorage for session continuity
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      activeCompanyId: null,

      /**
       * Set the authenticated user
       * Auto-selects first company as active if not set
       */
      setUser: (user) => {
        if (!user) {
          set({ user: null, activeCompanyId: null })
          return
        }

        // Determine active company
        const activeCompanyId = user.companyId || user.companies[0]?.id || null

        set({
          user,
          activeCompanyId,
        })
      },

      /**
       * Change the active company for the current user
       * Triggers a page reload to refetch data for the new company
       */
      setActiveCompany: (companyId) => {
        const { user } = get()

        // Verify user has access to this company
        if (user && !user.companies.some((c) => c.id === companyId) && user.globalRole !== 'SUPER_ADMIN') {
          console.error('[AUTH STORE] User does not have access to company:', companyId)
          return
        }

        set({ activeCompanyId: companyId })
      },

      /**
       * Get the active company details
       */
      getActiveCompany: () => {
        const { user, activeCompanyId } = get()
        if (!user || !activeCompanyId) return null

        return user.companies.find((c) => c.id === activeCompanyId) || null
      },

      /**
       * Logout the user and clear all state
       */
      logout: () => {
        set({ user: null, activeCompanyId: null })
      },
    }),
    {
      name: 'seguros-auth-storage', // localStorage key
    }
  )
)
