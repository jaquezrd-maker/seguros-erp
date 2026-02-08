import { Request, Response } from 'express'
import { AIService } from './ai.service'

const aiService = new AIService()

export class AIController {
  async getInsights(req: Request, res: Response) {
    try {
      const clientId = req.query.clientId ? Number(req.query.clientId) : undefined
      const insights = await aiService.getClientInsights(clientId)

      return res.status(200).json({
        success: true,
        data: insights,
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener insights',
      })
    }
  }

  async getClientSuggestions(req: Request, res: Response) {
    try {
      const clientId = Number(req.params.clientId)
      const suggestions = await aiService.getClientSuggestions(clientId)

      return res.status(200).json({
        success: true,
        data: suggestions,
      })
    } catch (error: any) {
      const status = error.message === 'Cliente no encontrado' ? 404 : 500
      return res.status(status).json({
        success: false,
        message: error.message || 'Error al obtener sugerencias',
      })
    }
  }

  async getOverallSuggestions(_req: Request, res: Response) {
    try {
      const suggestions = await aiService.getOverallSuggestions()

      return res.status(200).json({
        success: true,
        data: suggestions,
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener sugerencias',
      })
    }
  }

  async getPolicyStats(_req: Request, res: Response) {
    try {
      const stats = await aiService.getPolicyStats()

      return res.status(200).json({
        success: true,
        data: stats,
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener estadísticas',
      })
    }
  }
}
