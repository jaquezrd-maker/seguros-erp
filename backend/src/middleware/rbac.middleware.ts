import { Request, Response, NextFunction } from 'express'
import { UserRole } from '@prisma/client'

export function rbacMiddleware(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' })
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.log(`[RBAC] Access denied - User: ${req.user.email}, Role: ${req.user.role}, Allowed roles: ${allowedRoles.join(', ')}, Path: ${req.path}`)
      return res.status(403).json({ success: false, message: 'No tiene permisos para esta acción' })
    }

    next()
  }
}
