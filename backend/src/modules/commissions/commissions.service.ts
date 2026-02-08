import prisma from '../../config/database'

interface CommissionFilters {
  producerId?: number
  status?: string
  period?: string
  page?: number
  limit?: number
}

interface CreateCommissionInput {
  policyId: number
  producerId: number
  ruleId?: number
  premiumAmount: number
  rate: number
  amount: number
  period: string
}

export class CommissionsService {
  async findAll(filters: CommissionFilters) {
    const { producerId, status, period, page = 1, limit = 20 } = filters
    const skip = (page - 1) * limit

    const where: any = {}
    if (producerId) where.producerId = producerId
    if (status) where.status = status
    if (period) where.period = period

    const [data, total, pagadaSum, pendienteSum, pendienteCount] = await Promise.all([
      prisma.commission.findMany({
        where,
        include: {
          policy: {
            select: {
              id: true,
              policyNumber: true,
              status: true,
              premium: true,
              client: {
                select: { id: true, name: true },
              },
            },
          },
          producer: {
            select: { id: true, name: true, email: true },
          },
          rule: {
            select: { id: true, ratePercentage: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.commission.count({ where }),
      prisma.commission.aggregate({
        where: { ...where, status: 'PAGADA' },
        _sum: { amount: true },
      }),
      prisma.commission.aggregate({
        where: { ...where, status: 'PENDIENTE' },
        _sum: { amount: true },
      }),
      prisma.commission.count({ where: { ...where, status: 'PENDIENTE' } }),
    ])

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalPagado: Number(pagadaSum._sum.amount || 0),
        totalPendiente: Number(pendienteSum._sum.amount || 0),
        pendienteCount,
      },
    }
  }

  async findById(id: number) {
    const commission = await prisma.commission.findUnique({
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
            client: {
              select: { id: true, name: true, cedulaRnc: true },
            },
            insurer: {
              select: { id: true, name: true },
            },
          },
        },
        producer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        rule: true,
      },
    })

    if (!commission) {
      throw new Error('Comisión no encontrada')
    }

    return commission
  }

  async create(input: CreateCommissionInput) {
    const commission = await prisma.commission.create({
      data: {
        policyId: input.policyId,
        producerId: input.producerId,
        ruleId: input.ruleId || null,
        premiumAmount: input.premiumAmount,
        rate: input.rate,
        amount: input.amount,
        period: input.period,
        status: 'PENDIENTE',
      },
      include: {
        policy: {
          select: { id: true, policyNumber: true },
        },
        producer: {
          select: { id: true, name: true },
        },
      },
    })

    return commission
  }

  async markAsPaid(id: number) {
    const existing = await prisma.commission.findUnique({ where: { id } })

    if (!existing) {
      throw new Error('Comisión no encontrada')
    }

    if (existing.status === 'PAGADA') {
      throw new Error('La comisión ya fue pagada')
    }

    if (existing.status === 'ANULADA') {
      throw new Error('No se puede pagar una comisión anulada')
    }

    const commission = await prisma.commission.update({
      where: { id },
      data: {
        status: 'PAGADA',
        paidDate: new Date(),
      },
      include: {
        policy: {
          select: { id: true, policyNumber: true },
        },
        producer: {
          select: { id: true, name: true },
        },
      },
    })

    return commission
  }

  async delete(id: number, permanent: boolean = false) {
    const existing = await prisma.commission.findUnique({ where: { id } })
    
    if (!existing) {
      throw new Error('Comisión no encontrada')
    }

    // Hard delete: eliminación permanente
    if (permanent) {
      return prisma.commission.delete({
        where: { id },
      })
    }

    // Soft delete: set status to ANULADA
    if (existing.status === 'PAGADA') {
      throw new Error('No se puede anular una comisión que ya fue pagada. Use eliminación permanente si es necesario.')
    }

    return prisma.commission.update({
      where: { id },
      data: { status: 'ANULADA' },
      include: {
        policy: { select: { id: true, policyNumber: true } },
        producer: { select: { id: true, name: true } },
      },
    })
  }

  async getSummaryByProducer() {
    const producers = await prisma.user.findMany({
      where: {
        commissions: {
          some: {},
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        commissions: {
          select: {
            amount: true,
            status: true,
            period: true,
          },
        },
      },
    })

    const summary = producers.map((producer) => {
      const totalPending = producer.commissions
        .filter((c) => c.status === 'PENDIENTE')
        .reduce((sum, c) => sum + Number(c.amount), 0)

      const totalPaid = producer.commissions
        .filter((c) => c.status === 'PAGADA')
        .reduce((sum, c) => sum + Number(c.amount), 0)

      const totalAmount = producer.commissions.reduce(
        (sum, c) => sum + Number(c.amount),
        0
      )

      return {
        producerId: producer.id,
        producerName: producer.name,
        producerEmail: producer.email,
        totalCommissions: producer.commissions.length,
        totalAmount,
        totalPending,
        totalPaid,
      }
    })

    return summary
  }

  async generateFromPayment(policyId: number, paymentAmount: number, period: string) {
    // Obtener la póliza con todos sus datos relevantes
    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
      include: {
        insurer: true,
        insuranceType: true,
        creator: true,
      },
    })

    if (!policy) {
      throw new Error('Póliza no encontrada')
    }

    if (!policy.createdBy) {
      // No hay productor asignado, no se genera comisión
      return null
    }

    // Determinar la tasa de comisión a usar
    let commissionRate: number
    let ruleId: number | null = null

    if (policy.commissionRate) {
      // Usar la tasa personalizada de la póliza
      commissionRate = Number(policy.commissionRate)
    } else {
      // Buscar la regla de comisión aplicable
      const today = new Date()
      const rule = await prisma.commissionRule.findFirst({
        where: {
          insurerId: policy.insurerId,
          effectiveFrom: { lte: today },
          AND: [
            {
              OR: [
                { insuranceTypeId: policy.insuranceTypeId },
                { insuranceTypeId: null }, // Regla general para la aseguradora
              ],
            },
            {
              OR: [
                { effectiveTo: null },
                { effectiveTo: { gte: today } },
              ],
            },
          ],
        },
        orderBy: [
          { insuranceTypeId: 'desc' }, // Priorizar reglas específicas por tipo
          { effectiveFrom: 'desc' },
        ],
      })

      if (!rule) {
        // No hay regla de comisión aplicable
        return null
      }

      commissionRate = Number(rule.ratePercentage)
      ruleId = rule.id
    }

    // Calcular el monto de la comisión
    const commissionAmount = (paymentAmount * commissionRate) / 100

    // Crear la comisión
    const commission = await prisma.commission.create({
      data: {
        policyId: policy.id,
        producerId: policy.createdBy,
        ruleId,
        premiumAmount: paymentAmount,
        rate: commissionRate,
        amount: commissionAmount,
        period,
        status: 'PENDIENTE',
      },
      include: {
        policy: {
          select: { id: true, policyNumber: true },
        },
        producer: {
          select: { id: true, name: true },
        },
      },
    })

    return commission
  }
}
