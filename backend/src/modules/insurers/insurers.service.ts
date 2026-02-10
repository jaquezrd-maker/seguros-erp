import prisma from '../../config/database'
import { Prisma } from '@prisma/client'

interface FindAllFilters {
  search?: string
  status?: string
  page: number
  limit: number
}

export class InsurersService {
  async findAll(filters: FindAllFilters) {
    const { search, status, page, limit } = filters
    const skip = (page - 1) * limit

    const where: Prisma.InsurerWhereInput = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { rnc: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      where.status = status as Prisma.EnumInsurerStatusFilter['equals']
    }

    const [data, total] = await Promise.all([
      prisma.insurer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              policies: true,
              branches: true,
            },
          },
        },
      }),
      prisma.insurer.count({ where }),
    ])

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findById(id: number) {
    const insurer = await prisma.insurer.findUnique({
      where: { id },
      include: {
        branches: true,
        commissionRules: true,
        _count: {
          select: {
            policies: true,
          },
        },
      },
    })

    if (!insurer) {
      throw new Error('Aseguradora no encontrado')
    }

    return insurer
  }

  async create(data: Prisma.InsurerCreateInput) {
    const existing = await prisma.insurer.findUnique({
      where: { rnc: data.rnc },
    })

    if (existing) {
      throw new Error('Ya existe una aseguradora con este RNC')
    }

    return prisma.insurer.create({ data })
  }

  async update(id: number, data: Prisma.InsurerUpdateInput) {
    await this.findById(id)

    // Remove non-updatable fields
    const { id: _, createdAt, updatedAt, _count, ...updateData } = data as any

    return prisma.insurer.update({
      where: { id },
      data: updateData,
    })
  }

  async updateStatus(id: number, status: 'ACTIVA' | 'INACTIVA') {
    await this.findById(id)

    return prisma.insurer.update({
      where: { id },
      data: { status },
    })
  }

  async delete(id: number) {
    const insurer = await this.findById(id)

    // Check if insurer has active policies
    const activePolicies = await prisma.policy.count({
      where: {
        insurerId: id,
        status: 'VIGENTE',
      },
    })

    if (activePolicies > 0) {
      throw new Error('No se puede eliminar una aseguradora con pólizas vigentes')
    }

    // Soft delete by setting status to INACTIVA
    return prisma.insurer.update({
      where: { id },
      data: { status: 'INACTIVA' },
    })
  }
}
