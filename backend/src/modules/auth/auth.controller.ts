import { Request, Response } from 'express'
import { AuthService } from './auth.service'

const authService = new AuthService()

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son requeridos',
        })
      }

      const result = await authService.login({ email, password })

      return res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      const message = error.message || 'Error al iniciar sesión'
      const status = message === 'Credenciales inválidas' ? 401 : 500
      return res.status(status).json({
        success: false,
        message,
      })
    }
  }

  async register(req: Request, res: Response) {
    try {
      const { email, password, name, phone, role } = req.body

      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          message: 'Email, contraseña y nombre son requeridos',
        })
      }

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 8 caracteres',
        })
      }

      const user = await authService.register({ email, password, name, phone, role })

      return res.status(201).json({
        success: true,
        data: user,
        message: 'Usuario registrado exitosamente',
      })
    } catch (error: any) {
      const message = error.message || 'Error al registrar usuario'
      const status = message.includes('Ya existe') ? 409 : 500
      return res.status(status).json({
        success: false,
        message,
      })
    }
  }

  async me(req: Request, res: Response) {
    try {
      const supabaseUserId = req.user?.supabaseUserId

      if (!supabaseUserId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        })
      }

      const user = await authService.me(supabaseUserId)

      return res.status(200).json({
        success: true,
        data: user,
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener perfil de usuario',
      })
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '')

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token no proporcionado',
        })
      }

      await authService.logout(token)

      return res.status(200).json({
        success: true,
        message: 'Sesión cerrada exitosamente',
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al cerrar sesión',
      })
    }
  }

  async switchCompany(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      const { companyId } = req.body

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        })
      }

      await authService.switchCompany(userId, companyId)

      return res.status(200).json({
        success: true,
        message: 'Empresa cambiada exitosamente',
      })
    } catch (error: any) {
      const status = error.message.includes('no tiene acceso') ? 403 : 500
      return res.status(status).json({
        success: false,
        message: error.message || 'Error al cambiar de empresa',
      })
    }
  }
}
