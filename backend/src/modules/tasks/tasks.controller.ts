import { Request, Response, NextFunction } from 'express'
import { TasksService } from './tasks.service'

const service = new TasksService()

export const tasksController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id
      const { completed, priority } = req.query

      const tasks = await service.findAll({
        userId,
        completed: completed === 'true' ? true : completed === 'false' ? false : undefined,
        priority: priority as string | undefined,
      })

      res.json({ success: true, data: tasks })
    } catch (error) {
      next(error)
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id
      const id = parseInt(req.params.id as string)
      const task = await service.findById(id, userId)
      res.json({ success: true, data: task })
    } catch (error) {
      next(error)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id
      const companyId = req.user!.companyId
      const task = await service.create(userId, companyId, req.body)
      res.status(201).json({ success: true, data: task })
    } catch (error) {
      next(error)
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id
      const id = parseInt(req.params.id as string)
      const task = await service.update(id, userId, req.body)
      res.json({ success: true, data: task })
    } catch (error) {
      next(error)
    }
  },

  async toggleComplete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id
      const id = parseInt(req.params.id as string)
      const task = await service.toggleComplete(id, userId)
      res.json({ success: true, data: task })
    } catch (error) {
      next(error)
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id
      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)
      await service.delete(id, userId)
      res.json({ success: true, message: 'Tarea eliminada' })
    } catch (error) {
      next(error)
    }
  },
}
