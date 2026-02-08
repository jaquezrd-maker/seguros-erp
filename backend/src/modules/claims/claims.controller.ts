import { Request, Response } from 'express'
import { ClaimsService } from './claims.service'
import { ClaimStatus, ClaimPriority } from '@prisma/client'

const claimsService = new ClaimsService()

export class ClaimsController {
  async list(req: Request, res: Response) {
    try {
      const {
        search,
        status,
        priority,
        policyId,
        page = '1',
        limit = '10',
      } = req.query

      const result = await claimsService.findAll({
        search: search as string | undefined,
        status: status as ClaimStatus | undefined,
        priority: priority as ClaimPriority | undefined,
        policyId: policyId ? Number(policyId) : undefined,
        page: Math.max(1, Number(page)),
        limit: Math.min(100, Math.max(1, Number(limit))),
      })

      return res.json({ success: true, ...result })
    } catch (error) {
      console.error('Error listing claims:', error)
      return res.status(500).json({ success: false, message: 'Error al obtener siniestros' })
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)

      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID invalido' })
      }

      const claim = await claimsService.findById(id)

      if (!claim) {
        return res.status(404).json({ success: false, message: 'Siniestro no encontrado' })
      }

      return res.json({ success: true, data: claim })
    } catch (error) {
      console.error('Error getting claim:', error)
      return res.status(500).json({ success: false, message: 'Error al obtener siniestro' })
    }
  }

  async create(req: Request, res: Response) {
    try {
      const claim = await claimsService.create(req.body)
      return res.status(201).json({ success: true, data: claim, message: 'Siniestro creado exitosamente' })
    } catch (error) {
      console.error('Error creating claim:', error)
      return res.status(500).json({ success: false, message: 'Error al crear siniestro' })
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)

      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID invalido' })
      }

      const existing = await claimsService.findById(id)
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Siniestro no encontrado' })
      }

      const claim = await claimsService.update(id, req.body)
      return res.json({ success: true, data: claim, message: 'Siniestro actualizado exitosamente' })
    } catch (error) {
      console.error('Error updating claim:', error)
      return res.status(500).json({ success: false, message: 'Error al actualizar siniestro' })
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)

      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID invalido' })
      }

      const { status } = req.body

      if (!status || !Object.values(ClaimStatus).includes(status)) {
        return res.status(400).json({ success: false, message: 'Estado invalido' })
      }

      const existing = await claimsService.findById(id)
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Siniestro no encontrado' })
      }

      const claim = await claimsService.updateStatus(id, status as ClaimStatus)
      return res.json({ success: true, data: claim, message: 'Estado actualizado exitosamente' })
    } catch (error) {
      console.error('Error updating claim status:', error)
      return res.status(500).json({ success: false, message: 'Error al actualizar estado del siniestro' })
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID invalido' })
      }
      
      const permanent = req.query.permanent === 'true'
      const claim = await claimsService.delete(id, permanent)
      
      const message = permanent
        ? 'Siniestro eliminado permanentemente de la base de datos'
        : `Siniestro ${claim.claimNumber} rechazado exitosamente`
      
      return res.json({ success: true, message, data: claim })
    } catch (error: any) {
      const status = error.message?.includes('no encontrado') ? 404 : 500
      return res.status(status).json({ success: false, message: error.message || 'Error al eliminar siniestro' })
    }
  }

  async addNote(req: Request, res: Response) {
    try {
      const claimId = Number(req.params.id)

      if (isNaN(claimId)) {
        return res.status(400).json({ success: false, message: 'ID invalido' })
      }

      const existing = await claimsService.findById(claimId)
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Siniestro no encontrado' })
      }

      const userId = req.user!.id
      const { note, isInternal = true } = req.body

      const claimNote = await claimsService.addNote(claimId, userId, note, isInternal)
      return res.status(201).json({ success: true, data: claimNote, message: 'Nota agregada exitosamente' })
    } catch (error) {
      console.error('Error adding claim note:', error)
      return res.status(500).json({ success: false, message: 'Error al agregar nota al siniestro' })
    }
  }
}
