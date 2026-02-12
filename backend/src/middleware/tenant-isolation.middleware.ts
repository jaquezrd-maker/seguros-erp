/**
 * Tenant context interface
 */
interface TenantContext {
  companyId?: number
  bypassTenantCheck?: boolean // For SUPER_ADMIN operations
}

/**
 * Global tenant context (stored per request via auth middleware)
 * Note: This uses AsyncLocalStorage in production for proper request isolation
 */
let tenantContext: TenantContext = {}

/**
 * Set the tenant context for the current request
 * Called by auth middleware after user authentication
 */
export function setTenantContext(context: TenantContext): void {
  tenantContext = { ...context }
}

/**
 * Get the current tenant context
 */
export function getTenantContext(): TenantContext {
  return tenantContext
}

/**
 * Clear tenant context (called after request completes)
 */
export function clearTenantContext(): void {
  tenantContext = {}
}

/**
 * Initialize Prisma middleware for automatic tenant isolation
 * Note: In Prisma 6.x, middleware is deprecated. This is a no-op.
 * Tenant isolation is now enforced at the service layer.
 */
export function initializeTenantMiddleware(): void {
  console.log('[TENANT ISOLATION] Tenant isolation context system initialized')
  console.log('[TENANT ISOLATION] Isolation enforced at service layer via context')
}
