import { UserRole } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number
        email: string
        role: UserRole // Role in active company
        globalRole: UserRole // Global role (SUPER_ADMIN, etc.)
        supabaseUserId: string
        companyId?: number // Active company ID
        companies: Array<{
          id: number
          name: string
          slug: string
          role: UserRole
        }>
      }
      clientId?: number // For client portal isolation
    }
  }
}

export {}
