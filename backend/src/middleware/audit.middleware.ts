import { Request, Response, NextFunction } from 'express'
import prisma from '../config/database'

export function auditMiddleware(entityType: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res)

    res.json = function (body: any) {
      if (res.statusCode < 400 && req.user) {
        const action = req.method === 'POST' ? 'CREATE'
          : req.method === 'PUT' || req.method === 'PATCH' ? 'UPDATE'
          : req.method === 'DELETE' ? 'DELETE' : null

        if (action) {
          prisma.auditLog.create({
            data: {
              userId: req.user.id,
              action,
              entityType,
              entityId: parseInt(req.params.id as string) || body?.data?.id || 0,
              newValues: req.method !== 'DELETE' ? req.body : undefined,
              ipAddress: req.ip || null,
              userAgent: req.get('User-Agent') || null,
            } as any,
          }).catch(console.error)
        }
      }
      return originalJson(body)
    }

    next()
  }
}
