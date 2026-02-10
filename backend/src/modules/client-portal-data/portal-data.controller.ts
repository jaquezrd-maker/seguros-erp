import { Request, Response } from 'express'
import { portalDataService } from './portal-data.service'

export class PortalDataController {
  /**
   * GET /api/client-portal-data/dashboard
   * Obtener estadísticas del dashboard
   */
  getDashboard = async (req: Request, res: Response) => {
    try {
      const clientId = req.clientId!

      const stats = await portalDataService.getDashboard(clientId)

      return res.json({
        success: true,
        data: stats
      })
    } catch (error: any) {
      console.error('Error getting dashboard:', error)
      return res.status(500).json({
        success: false,
        message: error.message || 'Error obteniendo estadísticas'
      })
    }
  }

  /**
   * GET /api/client-portal-data/policies
   * Obtener pólizas del cliente
   */
  getPolicies = async (req: Request, res: Response) => {
    try {
      const clientId = req.clientId!
      const filters = req.query

      const policies = await portalDataService.getPolicies(clientId, filters)

      return res.json({
        success: true,
        data: policies
      })
    } catch (error: any) {
      console.error('Error getting policies:', error)
      return res.status(500).json({
        success: false,
        message: error.message || 'Error obteniendo pólizas'
      })
    }
  }

  /**
   * GET /api/client-portal-data/policies/:id
   * Obtener detalle de una póliza
   */
  getPolicyDetail = async (req: Request, res: Response) => {
    try {
      const clientId = req.clientId!
      const policyId = Number(req.params.id)

      const policy = await portalDataService.getPolicyDetail(clientId, policyId)

      return res.json({
        success: true,
        data: policy
      })
    } catch (error: any) {
      console.error('Error getting policy detail:', error)
      const statusCode = error.message === 'Póliza no encontrada' ? 404 : 500
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Error obteniendo detalle de póliza'
      })
    }
  }

  /**
   * GET /api/client-portal-data/payments
   * Obtener pagos del cliente
   */
  getPayments = async (req: Request, res: Response) => {
    try {
      const clientId = req.clientId!

      const payments = await portalDataService.getPayments(clientId)

      return res.json({
        success: true,
        data: payments
      })
    } catch (error: any) {
      console.error('Error getting payments:', error)
      return res.status(500).json({
        success: false,
        message: error.message || 'Error obteniendo pagos'
      })
    }
  }

  /**
   * GET /api/client-portal-data/renewals
   * Obtener renovaciones pendientes
   */
  getRenewals = async (req: Request, res: Response) => {
    try {
      const clientId = req.clientId!

      const renewals = await portalDataService.getRenewals(clientId)

      return res.json({
        success: true,
        data: renewals
      })
    } catch (error: any) {
      console.error('Error getting renewals:', error)
      return res.status(500).json({
        success: false,
        message: error.message || 'Error obteniendo renovaciones'
      })
    }
  }

  /**
   * GET /api/client-portal-data/claims
   * Obtener reclamos del cliente
   */
  getClaims = async (req: Request, res: Response) => {
    try {
      const clientId = req.clientId!

      const claims = await portalDataService.getClaims(clientId)

      return res.json({
        success: true,
        data: claims
      })
    } catch (error: any) {
      console.error('Error getting claims:', error)
      return res.status(500).json({
        success: false,
        message: error.message || 'Error obteniendo reclamos'
      })
    }
  }

  /**
   * POST /api/client-portal-data/claims
   * Crear un nuevo reclamo
   */
  createClaim = async (req: Request, res: Response) => {
    try {
      const clientId = req.clientId!
      const claimData = req.body

      const claim = await portalDataService.createClaim(clientId, claimData)

      return res.status(201).json({
        success: true,
        message: 'Reclamo creado exitosamente',
        data: claim
      })
    } catch (error: any) {
      console.error('Error creating claim:', error)
      return res.status(400).json({
        success: false,
        message: error.message || 'Error creando reclamo'
      })
    }
  }

  /**
   * GET /api/client-portal-data/profile
   * Obtener información del perfil del cliente
   */
  getProfile = async (req: Request, res: Response) => {
    try {
      const clientId = req.clientId!

      const profile = await portalDataService.getProfile(clientId)

      return res.json({
        success: true,
        data: profile
      })
    } catch (error: any) {
      console.error('Error getting profile:', error)
      return res.status(500).json({
        success: false,
        message: error.message || 'Error obteniendo perfil'
      })
    }
  }
}

export const portalDataController = new PortalDataController()
