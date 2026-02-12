import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../config/supabase'
import prisma from '../config/database'
import { setTenantContext, clearTenantContext } from './tenant-isolation.middleware'

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const companyIdHeader = req.headers['x-company-id'] as string

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token no proporcionado' })
  }

  try {
    console.log('[AUTH] Attempting to verify token, token length:', token.length)
    console.log('[AUTH] Token first 50 chars:', token.substring(0, 50))

    const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !supabaseUser) {
      console.error('[AUTH] Token verification failed:', error?.message || 'No user returned')
      console.error('[AUTH] Error object:', JSON.stringify(error, null, 2))
      return res.status(401).json({ success: false, message: 'Token inválido' })
    }

    const user = await prisma.user.findUnique({
      where: { supabaseUserId: supabaseUser.id },
      include: {
        companies: {
          where: { isActive: true },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
              },
            },
          },
        },
      },
    })

    if (!user || user.status !== 'ACTIVO') {
      return res.status(403).json({ success: false, message: 'Usuario inactivo o no registrado' })
    }

    // Determine active company and role
    let activeCompanyId: number | undefined
    let activeCompanyRole: string
    let bypassTenantCheck = false

    if (user.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN can bypass tenant checks OR target specific company
      bypassTenantCheck = !companyIdHeader
      activeCompanyId = companyIdHeader ? parseInt(companyIdHeader, 10) : undefined
      activeCompanyRole = 'SUPER_ADMIN'

      console.log(`[AUTH] SUPER_ADMIN - Bypass: ${bypassTenantCheck}, Target Company: ${activeCompanyId || 'none'}`)
    } else {
      // Regular users must have company access
      if (!user.companies.length) {
        return res.status(403).json({
          success: false,
          message: 'Usuario no tiene acceso a ninguna empresa'
        })
      }

      // Use company from header or user's activeCompanyId or first company
      const targetCompanyId = companyIdHeader
        ? parseInt(companyIdHeader, 10)
        : (user.activeCompanyId || user.companies[0].companyId)

      const companyAccess = user.companies.find(cu => cu.companyId === targetCompanyId)

      if (!companyAccess) {
        return res.status(403).json({
          success: false,
          message: 'Usuario no tiene acceso a la empresa solicitada'
        })
      }

      activeCompanyId = companyAccess.companyId
      activeCompanyRole = companyAccess.role

      console.log(`[AUTH] Regular user - Company: ${activeCompanyId}, Role: ${activeCompanyRole}`)
    }

    // Set tenant context for Prisma queries
    setTenantContext({
      companyId: activeCompanyId,
      bypassTenantCheck,
    })

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: activeCompanyRole as any, // Role in active company
      globalRole: user.role, // Global role (SUPER_ADMIN, etc.)
      supabaseUserId: supabaseUser.id,
      companyId: activeCompanyId,
      companies: user.companies.map(cu => ({
        id: cu.companyId,
        name: cu.company.name,
        slug: cu.company.slug,
        role: cu.role,
      })),
    }

    console.log(`[AUTH] User authenticated - Email: ${user.email}, Global Role: ${user.role}, Company: ${activeCompanyId || 'SUPER_ADMIN bypass'}`)

    // Update last login (don't await to avoid slowing down request)
    prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    }).catch(() => {})

    next()
  } catch (error) {
    console.error('[AUTH] Authentication error:', error)
    console.error('[AUTH] Error details:', JSON.stringify(error, null, 2))
    console.error('[AUTH] SUPABASE_URL:', process.env.SUPABASE_URL)
    console.error('[AUTH] Service key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.error('[AUTH] Service key first 20 chars:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20))
    return res.status(401).json({ success: false, message: 'Error de autenticación' })
  }
}

/**
 * Cleanup middleware - clears tenant context after request completes
 */
export function cleanupTenantContext(_req: Request, res: Response, next: NextFunction) {
  res.on('finish', () => {
    clearTenantContext()
  })
  next()
}
