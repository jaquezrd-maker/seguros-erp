import { Request, Response } from 'express'
import { UsersService } from './users.service'

const usersService = new UsersService()

export class UsersController {
  async list(req: Request, res: Response) {
    try {
      const { search, page, limit } = req.query

      const result = await usersService.findAll({
        search: search as string | undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      })

      return res.status(200).json({
        success: true,
        ...result,
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener usuarios',
      })
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const user = await usersService.findById(id)

      return res.status(200).json({
        success: true,
        data: user,
      })
    } catch (error: any) {
      const status = error.message === 'Usuario no encontrado' ? 404 : 500
      return res.status(status).json({
        success: false,
        message: error.message || 'Error al obtener usuario',
      })
    }
  }

  async create(req: Request, res: Response) {
    try {
      const user = await usersService.create(req.body)

      return res.status(201).json({
        success: true,
        data: user,
        message: 'Usuario creado exitosamente',
      })
    } catch (error: any) {
      const message = error.message || 'Error al crear usuario'
      const status = message.includes('Ya existe') ? 409 : 500
      return res.status(status).json({
        success: false,
        message,
      })
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const user = await usersService.update(id, req.body)

      return res.status(200).json({
        success: true,
        data: user,
        message: 'Usuario actualizado exitosamente',
      })
    } catch (error: any) {
      const message = error.message || 'Error al actualizar usuario'
      const status = message.includes('no encontrado')
        ? 404
        : message.includes('Ya existe')
          ? 409
          : 500
      return res.status(status).json({
        success: false,
        message,
      })
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const { status } = req.body

      const user = await usersService.updateStatus(id, status)

      return res.status(200).json({
        success: true,
        data: user,
        message: 'Estado de usuario actualizado exitosamente',
      })
    } catch (error: any) {
      const status = error.message === 'Usuario no encontrado' ? 404 : 500
      return res.status(status).json({
        success: false,
        message: error.message || 'Error al actualizar estado del usuario',
      })
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const permanent = req.query.permanent === 'true'
      const user = await usersService.delete(id, permanent)
      
      const message = permanent
        ? 'Usuario eliminado permanentemente de la base de datos'
        : `Usuario ${user.name} desactivado exitosamente`
      
      return res.json({ success: true, message, data: user })
    } catch (error: any) {
      const status = error.message === 'Usuario no encontrado' ? 404 : 500
      return res.status(status).json({
        success: false,
        message: error.message || 'Error al eliminar usuario',
      })
    }
  }
}
