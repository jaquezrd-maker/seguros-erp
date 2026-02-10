import prisma from '../../config/database'
import { Prisma } from '@prisma/client'

interface FindAllFilters {
  userId: number
  completed?: boolean
  priority?: string
}

export class TasksService {
  async findAll(filters: FindAllFilters) {
    const { userId, completed, priority } = filters

    const where: Prisma.TaskWhereInput = { userId }

    if (completed !== undefined) {
      where.completed = completed
    }

    if (priority) {
      where.priority = priority as Prisma.EnumTaskPriorityFilter['equals']
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ completed: 'asc' }, { priority: 'desc' }, { dueDate: 'asc' }],
    })

    return tasks
  }

  async findById(id: number, userId: number) {
    const task = await prisma.task.findFirst({
      where: { id, userId },
    })

    if (!task) {
      throw new Error('Tarea no encontrada')
    }

    return task
  }

  async create(userId: number, data: Prisma.TaskCreateInput) {
    // Convert dueDate string to Date if provided
    const processedData = { ...data, user: { connect: { id: userId } } }
    if (processedData.dueDate && typeof processedData.dueDate === 'string') {
      processedData.dueDate = new Date(processedData.dueDate)
    }

    return prisma.task.create({ data: processedData })
  }

  async update(id: number, userId: number, data: Prisma.TaskUpdateInput) {
    await this.findById(id, userId)

    // Convert dueDate string to Date if provided
    const processedData = { ...data }
    if (processedData.dueDate && typeof processedData.dueDate === 'string') {
      processedData.dueDate = new Date(processedData.dueDate)
    }

    // Remove non-updatable fields
    const { id: _, createdAt, updatedAt, userId: __, ...updateData } = processedData as any

    return prisma.task.update({
      where: { id },
      data: updateData,
    })
  }

  async toggleComplete(id: number, userId: number) {
    const task = await this.findById(id, userId)

    return prisma.task.update({
      where: { id },
      data: { completed: !task.completed },
    })
  }

  async delete(id: number, userId: number) {
    await this.findById(id, userId)

    return prisma.task.delete({ where: { id } })
  }
}
