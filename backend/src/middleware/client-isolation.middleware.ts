import { Request, Response, NextFunction } from 'express'
import prisma from '../config/database'

/**
 * Middleware to enforce data isolation for client portal users
 * Ensures CLIENTE role users can only access their own data
 */
export function clientDataIsolation() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Only apply to users with rol CLIENTE
      if (req.user?.role !== 'CLIENTE') {
        return next()
      }

      // Obtener registro de cliente vinculado a este usuario
      const client = await prisma.client.findUnique({
        where: { userId: req.user.id },
        select: { id: true, status: true }
      })

      if (!client) {
        return res.status(403).json({
          success: false,
          message: 'Acceso al portal no configurado. Contacte al administrador.'
        })
      }

      // Verificar que el cliente esté activo
      if (client.status !== 'ACTIVO') {
        return res.status(403).json({
          success: false,
          message: 'Su cuenta de cliente está suspendida. Contacte al administrador.'
        })
      }

      // Adjuntar clientId al request para uso en controladores
      req.clientId = client.id
      next()
    } catch (error) {
      console.error('Error in client data isolation middleware:', error)
      return res.status(500).json({
        success: false,
        message: 'Error verificando acceso al portal'
      })
    }
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      clientId?: number
    }
  }
}
