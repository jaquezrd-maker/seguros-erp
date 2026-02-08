import prisma from '../../config/database'

interface RenewalFilters {
  status?: string
  page?: number
  limit?: number
}

interface ProcessRenewalInput {
  newEndDate: string
  newPremium?: number | null
}

export class RenewalsService {
  async findAll(filters: RenewalFilters) {
    const { status, page = 1, limit = 20 } = filters
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) where.status = status

    const [data, total] = await Promise.all([
      prisma.renewal.findMany({
        where,
        include: {
          policy: {
            select: {
              id: true,
              policyNumber: true,
              status: true,
              premium: true,
              startDate: true,
              endDate: true,
              client: {
                select: { id: true, name: true, cedulaRnc: true },
              },
              insurer: {
                select: { id: true, name: true },
              },
            },
          },
          processor: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.renewal.count({ where }),
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
    const renewal = await prisma.renewal.findUnique({
      where: { id },
      include: {
        policy: {
          select: {
            id: true,
            policyNumber: true,
            status: true,
            premium: true,
            startDate: true,
            endDate: true,
            autoRenew: true,
            client: {
              select: { id: true, name: true, cedulaRnc: true, email: true, phone: true },
            },
            insurer: {
              select: { id: true, name: true },
            },
          },
        },
        processor: {
          select: { id: true, name: true },
        },
      },
    })

    if (!renewal) {
      throw new Error('Renovación no encontrada')
    }

    return renewal
  }

  async getPending() {
    const renewals = await prisma.renewal.findMany({
      where: {
        status: 'PENDIENTE',
        policy: {
          status: {
            notIn: ['CANCELADA'],
          },
        },
      },
      include: {
        policy: {
          select: {
            id: true,
            policyNumber: true,
            status: true,
            premium: true,
            endDate: true,
            autoRenew: true,
            client: {
              select: { id: true, name: true, email: true, phone: true },
            },
            insurer: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { originalEndDate: 'asc' },
    })

    return renewals
  }

  async process(id: number, input: ProcessRenewalInput, processedBy: number) {
    const existing = await prisma.renewal.findUnique({
      where: { id },
      include: { policy: true },
    })

    if (!existing) {
      throw new Error('Renovación no encontrada')
    }

    if (existing.status !== 'PENDIENTE') {
      throw new Error('Solo se pueden procesar renovaciones pendientes')
    }

    // Use a transaction to update both the renewal and the policy
    const result = await prisma.$transaction(async (tx) => {
      // Update the renewal record
      const renewal = await tx.renewal.update({
        where: { id },
        data: {
          status: 'PROCESADA',
          newEndDate: new Date(input.newEndDate),
          newPremium: input.newPremium ?? null,
          processedBy,
        },
      })

      // Update the associated policy
      const policyUpdateData: any = {
        endDate: new Date(input.newEndDate),
        status: 'VIGENTE',
      }
      if (input.newPremium) {
        policyUpdateData.premium = input.newPremium
      }

      await tx.policy.update({
        where: { id: existing.policyId },
        data: policyUpdateData,
      })

      return renewal
    })

    // Fetch the full record with relations
    const updated = await prisma.renewal.findUnique({
      where: { id: result.id },
      include: {
        policy: {
          select: {
            id: true,
            policyNumber: true,
            status: true,
            premium: true,
            endDate: true,
            client: {
              select: { id: true, name: true },
            },
          },
        },
        processor: {
          select: { id: true, name: true },
        },
      },
    })

    return updated
  }

  async notify(id: number) {
    const renewal = await prisma.renewal.findUnique({
      where: { id },
      include: {
        policy: {
          include: {
            client: {
              select: { id: true, name: true, email: true, phone: true },
            },
            insurer: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    if (!renewal) {
      throw new Error('Renovación no encontrada')
    }

    // Create a notification record for the renewal
    const notification = await prisma.notification.create({
      data: {
        policyId: renewal.policyId,
        type: 'RENOVACION',
        channel: 'EMAIL',
        recipient: renewal.policy.client.email || '',
        message: `Estimado/a ${renewal.policy.client.name}, su póliza ${renewal.policy.policyNumber} con ${renewal.policy.insurer.name} está próxima a vencer el ${renewal.originalEndDate.toISOString().split('T')[0]}. Por favor comuníquese con nosotros para gestionar su renovación.`,
        status: 'PENDIENTE',
      },
    })

    return {
      renewal,
      notification,
      message: 'Notificación de renovación creada exitosamente',
    }
  }

  async update(id: number, data: Partial<ProcessRenewalInput>) {
    const existing = await prisma.renewal.findUnique({
      where: { id },
    })

    if (!existing) {
      throw new Error('Renovación no encontrada')
    }

    if (existing.status !== 'PENDIENTE') {
      throw new Error('Solo se pueden editar renovaciones pendientes')
    }

    const updateData: any = {}
    if (data.newEndDate) {
      updateData.newEndDate = new Date(data.newEndDate)
    }
    if (data.newPremium !== undefined) {
      updateData.newPremium = data.newPremium
    }

    const renewal = await prisma.renewal.update({
      where: { id },
      data: updateData,
      include: {
        policy: {
          select: {
            id: true,
            policyNumber: true,
            status: true,
            premium: true,
            endDate: true,
            client: {
              select: { id: true, name: true },
            },
            insurer: {
              select: { id: true, name: true },
            },
            insuranceType: {
              select: { id: true, name: true },
            },
          },
        },
        processor: {
          select: { id: true, name: true },
        },
      },
    })

    return renewal
  }

  async delete(id: number) {
    const existing = await prisma.renewal.findUnique({
      where: { id },
    })

    if (!existing) {
      throw new Error('Renovación no encontrada')
    }

    if (existing.status === 'PROCESADA') {
      throw new Error('No se pueden eliminar renovaciones procesadas')
    }

    await prisma.renewal.delete({
      where: { id },
    })

    return { message: 'Renovación eliminada exitosamente' }
  }

  async generateRenewals(daysAhead: number = 60) {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + daysAhead)

    // Find active policies expiring within the specified timeframe
    const policies = await prisma.policy.findMany({
      where: {
        status: 'VIGENTE',
        endDate: {
          lte: futureDate,
        },
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
        insurer: {
          select: { id: true, name: true },
        },
      },
    })

    const created = []
    const skipped = []

    for (const policy of policies) {
      // Check if a pending renewal already exists for this policy
      const existingRenewal = await prisma.renewal.findFirst({
        where: {
          policyId: policy.id,
          status: 'PENDIENTE',
        },
      })

      if (existingRenewal) {
        skipped.push({
          policyNumber: policy.policyNumber,
          reason: 'Ya existe una renovación pendiente',
        })
        continue
      }

      // Create a new renewal record
      const renewal = await prisma.renewal.create({
        data: {
          policyId: policy.id,
          originalEndDate: policy.endDate,
          status: 'PENDIENTE',
        },
        include: {
          policy: {
            select: {
              policyNumber: true,
              client: { select: { name: true } },
              insurer: { select: { name: true } },
            },
          },
        },
      })

      created.push({
        id: renewal.id,
        policyNumber: renewal.policy.policyNumber,
        clientName: renewal.policy.client.name,
        insurerName: renewal.policy.insurer.name,
        endDate: policy.endDate,
      })
    }

    return {
      created: created.length,
      skipped: skipped.length,
      details: {
        created,
        skipped,
      },
    }
  }
}
