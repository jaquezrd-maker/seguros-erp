import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../config/supabase'
import prisma from '../config/database'

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')

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
    })

    if (!user || user.status !== 'ACTIVO') {
      return res.status(403).json({ success: false, message: 'Usuario inactivo o no registrado' })
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      supabaseUserId: supabaseUser.id,
    }

    console.log(`[AUTH] User authenticated - Email: ${user.email}, Role: ${user.role}, ID: ${user.id}`)

    // Update last login
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
