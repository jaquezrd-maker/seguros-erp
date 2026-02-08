import { Request, Response, NextFunction } from 'express'
import logger from '../utils/logger'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  logger.error(err.message, { stack: err.stack })

  if (err.message.includes('no encontrado') || err.message.includes('not found')) {
    return res.status(404).json({ success: false, message: err.message })
  }

  if (err.message.includes('Ya existe') || err.message.includes('duplicate')) {
    return res.status(409).json({ success: false, message: err.message })
  }

  if (err.message.includes('No se puede')) {
    return res.status(400).json({ success: false, message: err.message })
  }

  res.status(500).json({ success: false, message: 'Error interno del servidor' })
}
