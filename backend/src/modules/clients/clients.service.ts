import prisma from '../../config/database'
import { ClientType, ClientStatus, Prisma } from '@prisma/client'

interface FindAllFilters {
  search?: string
  type?: ClientType
  status?: ClientStatus
  page: number
  limit: number
}

export const clientsService = {
  async findAll(filters: FindAllFilters) {
    const { search, type, status, page, limit } = filters
    const skip = (page - 1) * limit

    const where: Prisma.ClientWhereInput = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { cedulaRnc: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (type) {
      where.type = type
    }

    if (status) {
      where.status = status
    } else {
      // By default exclude cancelled clients
      where.status = { not: 'CANCELADO' }
    }

    const [data, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          name: true,
          cedulaRnc: true,
          phone: true,
          phoneAlt: true,
          email: true,
          address: true,
          city: true,
          province: true,
          contactPerson: true,
          contactPosition: true,
          purchasingManager: true,
          birthDate: true,
          status: true,
          notes: true,
          userId: true, // Include userId for portal status
          createdBy: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              policies: true,
              payments: true,
            },
          },
        },
      }),
      prisma.client.count({ where }),
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
  },

  async findById(id: number) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        policies: {
          orderBy: { createdAt: 'desc' },
          include: {
            insurer: { select: { id: true, name: true } },
            insuranceType: { select: { id: true, name: true, category: true } },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        contacts: true,
        creator: { select: { id: true, name: true, email: true } },
        _count: {
          select: {
            policies: true,
            payments: true,
            contacts: true,
          },
        },
      },
    })

    if (!client) {
      throw new Error('Cliente no encontrado')
    }

    // Calculate client balance (pending payments - completed payments)
    const pendingPayments = await prisma.payment.aggregate({
      where: { clientId: id, status: 'PENDIENTE' },
      _sum: { amount: true },
    })

    const completedPayments = await prisma.payment.aggregate({
      where: { clientId: id, status: 'COMPLETADO' },
      _sum: { amount: true },
    })

    const balance = {
      pending: Number(pendingPayments._sum.amount || 0),
      completed: Number(completedPayments._sum.amount || 0),
      total: Number(pendingPayments._sum.amount || 0),
    }

    return { ...client, balance }
  },

  async create(data: Prisma.ClientCreateInput) {
    // Validate unique cedulaRnc
    const existing = await prisma.client.findUnique({
      where: { cedulaRnc: data.cedulaRnc },
    })

    if (existing) {
      throw new Error('Ya existe un cliente con esta cedula/RNC')
    }

    // Convert birthDate string to Date if provided
    const processedData = { ...data }
    if (processedData.birthDate && typeof processedData.birthDate === 'string') {
      processedData.birthDate = new Date(processedData.birthDate)
    }

    return prisma.client.create({
      data: processedData,
      include: {
        _count: {
          select: {
            policies: true,
            payments: true,
          },
        },
      },
    })
  },

  async update(id: number, data: Prisma.ClientUpdateInput) {
    // Verify client exists
    const client = await prisma.client.findUnique({ where: { id } })

    if (!client) {
      throw new Error('Cliente no encontrado')
    }

    // If updating cedulaRnc, validate uniqueness
    if (data.cedulaRnc && data.cedulaRnc !== client.cedulaRnc) {
      const existing = await prisma.client.findUnique({
        where: { cedulaRnc: data.cedulaRnc as string },
      })

      if (existing) {
        throw new Error('Ya existe un cliente con esta cedula/RNC')
      }
    }

    // Convert birthDate string to Date if provided
    const processedData = { ...data }
    if (processedData.birthDate && typeof processedData.birthDate === 'string') {
      processedData.birthDate = new Date(processedData.birthDate)
    }

    // Remove non-updatable fields
    const { id: _, createdAt, updatedAt, _count, balance, ...updateData } = processedData as any

    return prisma.client.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            policies: true,
            payments: true,
          },
        },
      },
    })
  },

  async delete(id: number) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        policies: {
          where: { status: 'VIGENTE' },
        },
      },
    })

    if (!client) {
      throw new Error('Cliente no encontrado')
    }

    if (client.policies.length > 0) {
      throw new Error('No se puede eliminar el cliente porque tiene pólizas activas')
    }

    // Soft delete: set status to CANCELADO
    return prisma.client.update({
      where: { id },
      data: { status: 'CANCELADO' },
    })
  },

  async updateStatus(id: number, status: ClientStatus) {
    const client = await prisma.client.findUnique({ where: { id } })

    if (!client) {
      throw new Error('Cliente no encontrado')
    }

    return prisma.client.update({
      where: { id },
      data: { status },
      include: {
        _count: {
          select: {
            policies: true,
            payments: true,
          },
        },
      },
    })
  },
}
