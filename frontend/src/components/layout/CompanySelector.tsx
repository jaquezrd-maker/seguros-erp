import { useState, useRef, useEffect } from 'react'
import { Building2, ChevronDown, Check } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

interface Company {
  id: number
  name: string
  role?: string
  slug?: string
  status?: string
}

/**
 * CompanySelector Component
 * Allows users with access to multiple companies to switch between them
 * SUPER_ADMIN can see and select ALL companies in the system
 * Triggers a page reload when company changes to refetch data
 */
export function CompanySelector() {
  const { user, activeCompanyId, setActiveCompany, getActiveCompany } = useAuthStore()
  const { refreshDbUser } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [allCompanies, setAllCompanies] = useState<Company[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const activeCompany = getActiveCompany()
  const isSuperAdmin = user?.globalRole === 'SUPER_ADMIN'

  // Load all companies if SUPER_ADMIN
  useEffect(() => {
    if (isSuperAdmin && isOpen && allCompanies.length === 0) {
      fetchAllCompanies()
    }
  }, [isSuperAdmin, isOpen])

  const fetchAllCompanies = async () => {
    try {
      setLoadingCompanies(true)
      const response = await api.get<{ success: boolean; data: Company[] }>('/companies')
      setAllCompanies(response.data)
    } catch (error) {
      console.error('[CompanySelector] Error fetching companies:', error)
    } finally {
      setLoadingCompanies(false)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Clear companies cache when dropdown closes so it refreshes on next open
  useEffect(() => {
    if (!isOpen && isSuperAdmin) {
      setAllCompanies([])
    }
  }, [isOpen, isSuperAdmin])

  // Determine which companies to show - filter out CANCELADO and SUSPENDIDO
  const availableCompanies = isSuperAdmin ? allCompanies : (user?.companies || [])
  const companiesToShow = availableCompanies.filter(
    (company) => !company.status || (company.status !== 'CANCELADO' && company.status !== 'SUSPENDIDO')
  )

  // Don't render if user has no active companies (unless SUPER_ADMIN)
  if (!user || (!companiesToShow.length && !isSuperAdmin)) {
    return null
  }

  // Don't render if user has only one active company and is not SUPER_ADMIN
  if (companiesToShow.length <= 1 && !isSuperAdmin) {
    return null
  }

  const handleCompanyChange = async (companyId: number | null) => {
    if (companyId === activeCompanyId || switching) {
      setIsOpen(false)
      return
    }

    setIsOpen(false)
    setSwitching(true)

    try {
      console.log('[CompanySelector] Starting switch to company:', companyId)
      console.log('[CompanySelector] Preparing API call...')

      // Persist company change to backend with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.error('[CompanySelector] Timeout reached, aborting...')
        controller.abort()
      }, 10000) // 10 second timeout

      try {
        console.log('[CompanySelector] Calling api.post...')
        const result = await api.post('/auth/switch-company', {
          companyId: companyId === 0 ? null : companyId
        })
        clearTimeout(timeoutId)
        console.log('[CompanySelector] Backend switch successful, result:', result)
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        console.error('[CompanySelector] API call error:', fetchError)
        if (fetchError.name === 'AbortError') {
          throw new Error('La solicitud tardó demasiado. Por favor intenta de nuevo.')
        }
        throw fetchError
      }

      console.log('[CompanySelector] Refreshing user data...')

      // Refresh user data with timeout
      const refreshTimeout = setTimeout(() => {
        console.warn('[CompanySelector] Refresh taking too long, navigating anyway')
        window.location.href = '/'
      }, 5000)

      try {
        await refreshDbUser()
        clearTimeout(refreshTimeout)
        console.log('[CompanySelector] User data refreshed successfully')
      } catch (refreshError) {
        clearTimeout(refreshTimeout)
        console.error('[CompanySelector] Error refreshing user:', refreshError)
        // Continue anyway - the backend has the change
      }

      console.log('[CompanySelector] Navigating to home...')
      window.location.href = '/'
    } catch (error: any) {
      console.error('[CompanySelector] Fatal error during switch:', error)
      const message = error?.message || error?.response?.data?.message || 'Error al cambiar de empresa'
      alert(message)
      setSwitching(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => !switching && setIsOpen(!isOpen)}
        disabled={switching}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
          switching
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-slate-800'
        }`}
        aria-label="Seleccionar empresa"
      >
        <Building2 className="w-5 h-5 text-slate-300" />
        <div className="flex flex-col items-start">
          <span className="text-xs text-slate-400">
            {switching ? 'Cambiando...' : 'Empresa'}
          </span>
          <span className="text-sm font-medium text-white">
            {activeCompany?.name || 'Todas las empresas'}
          </span>
        </div>
        {!switching && (
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2">
              Seleccionar Empresa
            </div>

            {/* SUPER_ADMIN option to view all companies */}
            {isSuperAdmin && (
              <button
                onClick={() => handleCompanyChange(null)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Todas las empresas
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Vista global</span>
                </div>
                {!activeCompanyId && <Check className="w-4 h-4 text-blue-600" />}
              </button>
            )}

            {/* Loading state */}
            {loadingCompanies && (
              <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                Cargando empresas...
              </div>
            )}

            {/* Companies list */}
            {!loadingCompanies && companiesToShow.map((company) => (
              <button
                key={company.id}
                onClick={() => handleCompanyChange(company.id)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {company.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {company.role || 'SUPER_ADMIN'}
                  </span>
                </div>
                {company.id === activeCompanyId && <Check className="w-4 h-4 text-blue-600" />}
              </button>
            ))}

            {/* Empty state */}
            {!loadingCompanies && companiesToShow.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No hay empresas disponibles
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
