import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../config/supabase'
import prisma from '../config/database'

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token no proporcionado' })
  }

  try {
    const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !supabaseUser) {
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
  } catch {
    return res.status(401).json({ success: false, message: 'Error de autenticación' })
  }
}
