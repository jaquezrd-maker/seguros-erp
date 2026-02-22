import { Request, Response } from 'express'
import quotationsService from './quotations.service'

class QuotationsController {
  async list(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId
      const { page = '1', limit = '10', status, search } = req.query
      const result = await quotationsService.findAll(companyId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        search: search as string,
      })
      return res.json({ success: true, ...result })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId
      const id = parseInt(req.params.id as string)
      const quotation = await quotationsService.findById(id, companyId)
      if (!quotation) {
        return res.status(404).json({ success: false, message: 'Cotización no encontrada' })
      }
      return res.json({ success: true, data: quotation })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  async create(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId
      const userId = req.user!.id
      if (!companyId) {
        return res.status(400).json({ success: false, message: 'Empresa activa requerida' })
      }
      const quotation = await quotationsService.create(companyId, userId, req.body)
      return res.status(201).json({ success: true, data: quotation })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  async update(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId
      const id = parseInt(req.params.id as string)
      const quotation = await quotationsService.update(id, companyId, req.body)
      return res.json({ success: true, data: quotation })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId
      const id = parseInt(req.params.id as string)
      const { status } = req.body
      const quotation = await quotationsService.updateStatus(id, companyId, status)
      return res.json({ success: true, data: quotation })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId
      const id = parseInt(req.params.id as string)
      await quotationsService.delete(id, companyId)
      return res.json({ success: true, message: 'Cotización eliminada' })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  async listProposals(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId
      const { page = '1', limit = '10', status } = req.query
      const result = await quotationsService.findAllProposals(companyId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
      })
      return res.json({ success: true, ...result })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  async getProposalById(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId
      const id = parseInt(req.params.id as string)
      const proposal = await quotationsService.findProposalById(id, companyId)
      if (!proposal) {
        return res.status(404).json({ success: false, message: 'Propuesta no encontrada' })
      }
      return res.json({ success: true, data: proposal })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  async createProposal(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId
      const userId = req.user!.id
      if (!companyId) {
        return res.status(400).json({ success: false, message: 'Empresa activa requerida' })
      }
      const proposal = await quotationsService.createProposal(companyId, userId, req.body)
      return res.status(201).json({ success: true, data: proposal })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  async updateProposalStatus(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId
      const id = parseInt(req.params.id as string)
      const { status } = req.body
      const proposal = await quotationsService.updateProposalStatus(id, companyId, status)
      return res.json({ success: true, data: proposal })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  async generateProposalFromQuotation(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId
      const userId = req.user!.id
      const quotationId = parseInt(req.params.id as string)
      if (!companyId) {
        return res.status(400).json({ success: false, message: 'Empresa activa requerida' })
      }
      const proposal = await quotationsService.generateProposalFromQuotation(quotationId, companyId, userId)
      return res.status(201).json({ success: true, data: proposal })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  }
}

export default new QuotationsController()
