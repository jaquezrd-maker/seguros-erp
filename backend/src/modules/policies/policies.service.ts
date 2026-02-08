import prisma from '../../config/database'
import { PolicyStatus, PaymentMethod, Prisma } from '@prisma/client'

interface FindAllFilters {
  search?: string
  status?: PolicyStatus
  insurerId?: number
  clientId?: number
  page: number
  limit: number
}

interface CreatePolicyData {
  policyNumber?: string
  clientId: number
  insurerId: number
  insuranceTypeId: number
  startDate: string
  endDate: string
  premium: number
  paymentMethod: PaymentMethod
  numberOfInstallments?: number
  autoRenew?: boolean
  beneficiaryData?: any
  notes?: string
  createdBy?: number
  paymentSchedule?: Array<{
    month: number
    dueDate: string
    amount: number
    reminderDays?: number
  }>
}

interface UpdatePolicyData {
  policyNumber?: string
  clientId?: number
  insurerId?: number
  insuranceTypeId?: number
  startDate?: string
  endDate?: string
  premium?: number
  paymentMethod?: PaymentMethod
  numberOfInstallments?: number
  autoRenew?: boolean
  beneficiaryData?: any
  notes?: string
}

export const policiesService = {
  async findAll(filters: FindAllFilters) {
    const { search, status, insurerId, clientId, page, limit } = filters
    const skip = (page - 1) * limit

    const where: Prisma.PolicyWhereInput = {}

    if (search) {
      where.OR = [
        { policyNumber: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
        { client: { cedulaRnc: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (insurerId) {
      where.insurerId = insurerId
    }

    if (clientId) {
      where.clientId = clientId
    }

    const [data, total, vigenteCount, vencidaCount, totalPremiumAgg] = await Promise.all([
      prisma.policy.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, cedulaRnc: true } },
          insurer: { select: { id: true, name: true } },
          insuranceType: { select: { id: true, name: true, category: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.policy.count({ where }),
      prisma.policy.count({ where: { ...where, status: 'VIGENTE' } }),
      prisma.policy.count({ where: { ...where, status: 'VENCIDA' } }),
      prisma.policy.aggregate({
        where,
        _sum: { premium: true },
      }),
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
        vigenteCount,
        vencidaCount,
        totalPremium: Number(totalPremiumAgg._sum.premium || 0),
      },
    }
  },

  async findById(id: number) {
    const policy = await prisma.policy.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, cedulaRnc: true, phone: true, email: true } },
        insurer: { select: { id: true, name: true, rnc: true } },
        insuranceType: { select: { id: true, name: true, category: true } },
        endorsements: { orderBy: { effectiveDate: 'desc' } },
        claims: { orderBy: { createdAt: 'desc' } },
        payments: { orderBy: { paymentDate: 'desc' } },
        renewals: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!policy) {
      throw new Error('Póliza no encontrado')
    }

    return policy
  },

  async create(data: CreatePolicyData) {
    let { policyNumber } = data

    if (!policyNumber) {
      policyNumber = await generatePolicyNumber()
    }

    const existing = await prisma.policy.findUnique({
      where: { policyNumber },
    })

    if (existing) {
      throw new Error('Ya existe una póliza con este número')
    }

    const policy = await prisma.policy.create({
      data: {
        policyNumber,
        clientId: data.clientId,
        insurerId: data.insurerId,
        insuranceTypeId: data.insuranceTypeId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        premium: data.premium,
        paymentMethod: data.paymentMethod,
        autoRenew: data.autoRenew ?? false,
        notes: data.notes,
        createdBy: data.createdBy,
      },
      include: {
        client: { select: { id: true, name: true, cedulaRnc: true } },
        insurer: { select: { id: true, name: true } },
        insuranceType: { select: { id: true, name: true, category: true } },
      },
    })

    // Generate payments based on payment schedule if provided
    if (data.paymentSchedule && data.paymentSchedule.length > 0) {
      const payments = data.paymentSchedule.map((payment, index) => ({
        policyId: policy.id,
        clientId: data.clientId,
        amount: payment.amount,
        dueDate: new Date(payment.dueDate),
        paymentDate: new Date(payment.dueDate),
        paymentMethod: data.paymentMethod,
        status: 'PENDIENTE' as const,
        concept: `Cuota ${index + 1} de ${data.paymentSchedule!.length} - ${policyNumber}`,
        reminderDays: payment.reminderDays || 7,
        reminderSent: false,
      }))

      await prisma.payment.createMany({
        data: payments,
      })
    }

    return policy
  },

  async update(id: number, data: UpdatePolicyData) {
    const existing = await prisma.policy.findUnique({
      where: { id },
      include: {
        payments: {
          where: {
            status: { in: ['PENDIENTE', 'COMPLETADO'] }
          }
        }
      }
    })

    if (!existing) {
      throw new Error('Póliza no encontrado')
    }

    if (data.policyNumber && data.policyNumber !== existing.policyNumber) {
      const duplicate = await prisma.policy.findUnique({
        where: { policyNumber: data.policyNumber },
      })
      if (duplicate) {
        throw new Error('Ya existe una póliza con este número')
      }
    }

    // Validar cambio de método de pago si hay pagos registrados
    if (data.paymentMethod !== undefined && data.paymentMethod !== existing.paymentMethod) {
      const hasPayments = existing.payments && existing.payments.length > 0
      if (hasPayments) {
        throw new Error(
          `No se puede cambiar el método de pago porque la póliza ya tiene ${existing.payments.length} pago(s) registrado(s). Debe anular los pagos primero.`
        )
      }
    }

    const updateData: Prisma.PolicyUpdateInput = {}

    if (data.policyNumber !== undefined) updateData.policyNumber = data.policyNumber
    if (data.clientId !== undefined) updateData.client = { connect: { id: data.clientId } }
    if (data.insurerId !== undefined) updateData.insurer = { connect: { id: data.insurerId } }
    if (data.insuranceTypeId !== undefined) updateData.insuranceType = { connect: { id: data.insuranceTypeId } }
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate)
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate)
    if (data.premium !== undefined) updateData.premium = data.premium
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod
    if (data.autoRenew !== undefined) updateData.autoRenew = data.autoRenew
    if (data.notes !== undefined) updateData.notes = data.notes

    const policy = await prisma.policy.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true, cedulaRnc: true } },
        insurer: { select: { id: true, name: true } },
        insuranceType: { select: { id: true, name: true, category: true } },
      },
    })

    return policy
  },

  async updateStatus(id: number, status: PolicyStatus) {
    const existing = await prisma.policy.findUnique({ where: { id } })

    if (!existing) {
      throw new Error('Póliza no encontrado')
    }

    const policy = await prisma.policy.update({
      where: { id },
      data: { status },
      include: {
        client: { select: { id: true, name: true, cedulaRnc: true } },
        insurer: { select: { id: true, name: true } },
        insuranceType: { select: { id: true, name: true, category: true } },
      },
    })

    return policy
  },

  async delete(id: number) {
    const policy = await prisma.policy.findUnique({ where: { id } })

    if (!policy) {
      throw new Error('Póliza no encontrada')
    }

    // Soft delete: cambiar estado a CANCELADA
    return prisma.policy.update({
      where: { id },
      data: { status: 'CANCELADA' },
      include: {
        client: { select: { id: true, name: true, cedulaRnc: true } },
        insurer: { select: { id: true, name: true } },
        insuranceType: { select: { id: true, name: true, category: true } },
      },
    })
  },

  async permanentDelete(id: number) {
    // Ejecutar toda la lógica dentro de una transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verificar que la póliza existe y obtener sus datos
      const policy = await tx.policy.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              payments: true,
              claims: true,
              commissions: true,
              renewals: true,
              endorsements: true,
              notifications: true,
            }
          }
        }
      })

      if (!policy) {
        throw new Error('Póliza no encontrada')
      }

      // 2. Eliminar notificaciones
      await tx.notification.deleteMany({ where: { policyId: id } })

      // 3. Eliminar renovaciones
      await tx.renewal.deleteMany({ where: { policyId: id } })

      // 4. Eliminar comisiones
      await tx.commission.deleteMany({ where: { policyId: id } })

      // 5. Eliminar pagos
      await tx.payment.deleteMany({ where: { policyId: id } })

      // 6. Eliminar siniestros (y sus documentos y notas)
      const claims = await tx.claim.findMany({
        where: { policyId: id },
        select: { id: true }
      })

      for (const claim of claims) {
        // Eliminar documentos del claim
        await tx.document.deleteMany({
          where: {
            entityType: 'CLAIM',
            entityId: claim.id
          }
        })
        // Eliminar notas del claim
        await tx.claimNote.deleteMany({ where: { claimId: claim.id } })
      }
      await tx.claim.deleteMany({ where: { policyId: id } })

      // 7. Eliminar endosos (y sus documentos)
      const endorsements = await tx.endorsement.findMany({
        where: { policyId: id },
        select: { id: true }
      })

      for (const endorsement of endorsements) {
        // Eliminar documentos del endorsement
        await tx.document.deleteMany({
          where: {
            entityType: 'ENDORSEMENT',
            entityId: endorsement.id
          }
        })
      }
      await tx.endorsement.deleteMany({ where: { policyId: id } })

      // 8. Finalmente eliminar la póliza
      await tx.policy.delete({ where: { id } })

      // Retornar los datos para el mensaje de éxito
      return {
        policyNumber: policy.policyNumber,
        deleted: {
          payments: policy._count.payments,
          claims: policy._count.claims,
          commissions: policy._count.commissions,
          renewals: policy._count.renewals,
          endorsements: policy._count.endorsements,
          notifications: policy._count.notifications,
        }
      }
    })

    return result
  },

  async getExpiring(days: number = 30) {
    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + days)

    const policies = await prisma.policy.findMany({
      where: {
        status: 'VIGENTE',
        endDate: {
          gte: today,
          lte: futureDate,
        },
      },
      include: {
        client: { select: { id: true, name: true, cedulaRnc: true, phone: true, email: true } },
        insurer: { select: { id: true, name: true } },
        insuranceType: { select: { id: true, name: true, category: true } },
      },
      orderBy: { endDate: 'asc' },
    })

    return policies
  },
}

async function generatePolicyNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `POL-${year}-`

  const lastPolicy = await prisma.policy.findFirst({
    where: {
      policyNumber: { startsWith: prefix },
    },
    orderBy: { policyNumber: 'desc' },
  })

  let nextNumber = 1
  if (lastPolicy) {
    const lastNumber = parseInt(lastPolicy.policyNumber.replace(prefix, ''), 10)
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1
    }
  }

  return `${prefix}${String(nextNumber).padStart(3, '0')}`
}
