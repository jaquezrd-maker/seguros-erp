import { Request, Response } from 'express'
import { clientPortalService } from './client-portal.service'

export class ClientPortalController {
  /**
   * POST /api/client-portal/invitations/:clientId
   * Crear invitación para acceso al portal (solo usuarios internos)
   */
  createInvitation = async (req: Request, res: Response) => {
    try {
      const clientId = Number(req.params.clientId)
      const createdBy = req.user!.id

      const invitation = await clientPortalService.createInvitation(clientId, createdBy)

      // Generar URL de registro
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
      const registrationUrl = `${frontendUrl}/client/register/${invitation.token}`

      return res.status(201).json({
        success: true,
        message: 'Invitación creada exitosamente. Copia el enlace y envíalo al cliente.',
        data: {
          id: invitation.id,
          email: invitation.email,
          expiresAt: invitation.expiresAt,
          registrationUrl: registrationUrl
        }
      })
    } catch (error: any) {
      console.error('Error creating invitation:', error)
      return res.status(400).json({
        success: false,
        message: error.message || 'Error creando invitación'
      })
    }
  }

  /**
   * GET /api/client-portal/validate/:token
   * Validar token de invitación (ruta pública)
   */
  validateInvitation = async (req: Request, res: Response) => {
    try {
      const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token

      const invitation = await clientPortalService.validateInvitation(token)

      return res.json({
        success: true,
        data: {
          clientName: invitation.clientName,
          email: invitation.email
        }
      })
    } catch (error: any) {
      console.error('Error validating invitation:', error)
      return res.status(400).json({
        success: false,
        message: error.message || 'Token inválido'
      })
    }
  }

  /**
   * POST /api/client-portal/register
   * Completar registro de cliente (ruta pública)
   */
  completeRegistration = async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body

      const result = await clientPortalService.completeRegistration(token, password)

      return res.status(201).json({
        success: true,
        message: result.message
      })
    } catch (error: any) {
      console.error('Error completing registration:', error)
      return res.status(400).json({
        success: false,
        message: error.message || 'Error completando registro'
      })
    }
  }

  /**
   * POST /api/client-portal/change-password
   * Cambiar contraseña (requiere autenticación)
   */
  changePassword = async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id
      const { currentPassword, newPassword } = req.body

      await clientPortalService.changePassword(userId, currentPassword, newPassword)

      return res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      })
    } catch (error: any) {
      console.error('Error changing password:', error)
      return res.status(400).json({
        success: false,
        message: error.message || 'Error cambiando contraseña'
      })
    }
  }
}

export const clientPortalController = new ClientPortalController()
