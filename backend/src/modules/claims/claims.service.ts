import prisma from '../../config/database'
import { ClaimStatus, ClaimPriority, Prisma } from '@prisma/client'

interface FindAllFilters {
  search?: string
  status?: ClaimStatus
  priority?: ClaimPriority
  policyId?: number
  page: number
  limit: number
}

interface CreateClaimData {
  policyId: number
  type: string
  dateOccurred: string
  description?: string | null
  estimatedAmount?: number | null
  priority?: ClaimPriority
}

interface UpdateClaimData {
  policyId?: number
  type?: string
  dateOccurred?: string
  description?: string | null
  estimatedAmount?: number | null
  priority?: ClaimPriority
}

export class ClaimsService {
  async findAll(filters: FindAllFilters) {
    const { search, status, priority, policyId, page, limit } = filters
    const skip = (page - 1) * limit

    const where: Prisma.ClaimWhereInput = {}

    if (search) {
      where.OR = [
        { claimNumber: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { policy: { client: { name: { contains: search, mode: 'insensitive' } } } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }

    if (policyId) {
      where.policyId = policyId
    }

    const [data, total] = await Promise.all([
      prisma.claim.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          policy: {
            include: {
              client: true,
              insurer: true,
            },
          },
        },
      }),
      prisma.claim.count({ where }),
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
    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
        policy: {
          include: {
            client: true,
            insurer: true,
          },
        },
        notes: {
          include: {
            user: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { notes: true },
        },
      },
    })

    return claim
  }

  async create(data: CreateClaimData) {
    const claimNumber = await this.generateClaimNumber()

    const claim = await prisma.claim.create({
      data: {
        claimNumber,
        policyId: data.policyId,
        type: data.type,
        dateOccurred: new Date(data.dateOccurred),
        description: data.description ?? null,
        estimatedAmount: data.estimatedAmount ?? null,
        priority: data.priority ?? 'MEDIA',
      },
      include: {
        policy: {
          include: {
            client: true,
            insurer: true,
          },
        },
      },
    })

    return claim
  }

  async update(id: number, data: UpdateClaimData) {
    const updateData: Prisma.ClaimUpdateInput = {}

    if (data.policyId !== undefined) updateData.policy = { connect: { id: data.policyId } }
    if (data.type !== undefined) updateData.type = data.type
    if (data.dateOccurred !== undefined) updateData.dateOccurred = new Date(data.dateOccurred)
    if (data.description !== undefined) updateData.description = data.description
    if (data.estimatedAmount !== undefined) updateData.estimatedAmount = data.estimatedAmount
    if (data.priority !== undefined) updateData.priority = data.priority

    const claim = await prisma.claim.update({
      where: { id },
      data: updateData,
      include: {
        policy: {
          include: {
            client: true,
            insurer: true,
          },
        },
      },
    })

    return claim
  }

  async updateStatus(id: number, status: ClaimStatus) {
    const claim = await prisma.claim.update({
      where: { id },
      data: { status },
      include: {
        policy: {
          include: {
            client: true,
            insurer: true,
          },
        },
      },
    })

    return claim
  }

  async addNote(claimId: number, userId: number, note: string, isInternal: boolean = true) {
    const claimNote = await prisma.claimNote.create({
      data: {
        claimId,
        userId,
        note,
        isInternal,
      },
      include: {
        user: true,
      },
    })

    return claimNote
  }

  async delete(id: number, permanent: boolean = false) {
    const claim = await prisma.claim.findUnique({ 
      where: { id },
      include: { notes: true }
    })
    
    if (!claim) {
      throw new Error('Siniestro no encontrado')
    }

    // Hard delete: eliminación permanente
    if (permanent) {
      // Las notas se eliminan automáticamente (onDelete: Cascade en schema)
      return prisma.claim.delete({
        where: { id },
      })
    }

    // Soft delete: set status to RECHAZADO
    return prisma.claim.update({
      where: { id },
      data: { status: 'RECHAZADO' },
      include: {
        policy: { include: { client: true, insurer: true } },
      },
    })
  }

  private async generateClaimNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `SIN-${year}-`

    const lastClaim = await prisma.claim.findFirst({
      where: {
        claimNumber: { startsWith: prefix },
      },
      orderBy: { claimNumber: 'desc' },
    })

    let nextNumber = 1
    if (lastClaim) {
      const lastNumber = parseInt(lastClaim.claimNumber.replace(prefix, ''), 10)
      nextNumber = lastNumber + 1
    }

    return `${prefix}${String(nextNumber).padStart(3, '0')}`
  }
}
