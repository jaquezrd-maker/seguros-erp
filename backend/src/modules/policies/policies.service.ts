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
  autoRenew?: boolean
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
  autoRenew?: boolean
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
          payments: {
            select: {
              id: true,
              status: true,
              dueDate: true,
            },
            where: {
              status: 'PENDIENTE',
            },
          },
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

    // Add payment status flags to each policy
    const today = new Date()
    const dataWithPaymentStatus = data.map(policy => {
      const pendingPayments = policy.payments || []
      const hasPendingPayments = pendingPayments.length > 0
      const hasOverduePayments = pendingPayments.some(payment =>
        payment.dueDate && new Date(payment.dueDate) < today
      )

      // Remove payments array from response and add flags
      const { payments, ...policyData } = policy
      return {
        ...policyData,
        hasPendingPayments,
        hasOverduePayments,
      }
    })

    return {
      data: dataWithPaymentStatus,
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
        insurer: { select: { id: true, name: true, rnc: true, email: true } },
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
    const existing = await prisma.policy.findUnique({ where: { id } })

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

  async delete(id: number, permanent: boolean = false) {
    const policy = await prisma.policy.findUnique({ 
      where: { id },
      include: {
        payments: {
          where: {
            status: 'PENDIENTE'
          }
        },
        claims: {
          where: {
            status: { in: ['PENDIENTE', 'EN_PROCESO', 'EN_REVISION'] }
          }
        },
        commissions: {
          where: {
            status: 'PENDIENTE'
          }
        },
        renewals: {
          where: {
            status: 'PENDIENTE'
          }
        },
      }
    })

    if (!policy) {
      throw new Error('Póliza no encontrada')
    }

    // Hard delete: eliminación permanente de la base de datos
    if (permanent) {
      // Verificar si tiene datos relacionados activos que impedirían la eliminación
      const pendingPayments = policy.payments.length
      const activeClaims = policy.claims.length
      const pendingCommissions = policy.commissions.length
      const pendingRenewals = policy.renewals.length

      const hasRelatedData = 
        pendingPayments > 0 ||
        activeClaims > 0 ||
        pendingCommissions > 0 ||
        pendingRenewals > 0

      if (hasRelatedData) {
        // Construir mensaje detallado
        const details: string[] = []
        if (pendingPayments > 0) details.push(`${pendingPayments} pago(s) pendiente(s)`)
        if (activeClaims > 0) details.push(`${activeClaims} siniestro(s) activo(s)`)
        if (pendingCommissions > 0) details.push(`${pendingCommissions} comisión(es) pendiente(s)`)
        if (pendingRenewals > 0) details.push(`${pendingRenewals} renovación(es) pendiente(s)`)

        throw new Error(
          `No se puede eliminar permanentemente esta póliza porque tiene datos activos relacionados: ${details.join(', ')}. Primero debe eliminar o anular estos registros, o usar la cancelación.`
        )
      }

      // Eliminar todos los datos relacionados que no son pendientes/activos
      // Esto incluye pagos completados/anulados, siniestros rechazados, etc.
      await prisma.$transaction(async (tx) => {
        // Eliminar notificaciones relacionadas
        await tx.notification.deleteMany({ where: { policyId: id } })
        
        // Eliminar renovaciones procesadas/rechazadas/vencidas
        await tx.renewal.deleteMany({ 
          where: { 
            policyId: id,
            status: { not: 'PENDIENTE' }
          } 
        })
        
        // Eliminar comisiones pagadas/anuladas
        await tx.commission.deleteMany({ 
          where: { 
            policyId: id,
            status: { not: 'PENDIENTE' }
          } 
        })
        
        // Eliminar pagos completados/anulados
        await tx.payment.deleteMany({ 
          where: { 
            policyId: id,
            status: { not: 'PENDIENTE' }
          } 
        })
        
        // Eliminar siniestros rechazados/aprobados/pagados
        await tx.claim.deleteMany({ 
          where: { 
            policyId: id,
            status: { notIn: ['PENDIENTE', 'EN_PROCESO', 'EN_REVISION'] }
          } 
        })
        
        // Los endorsements se eliminan automáticamente por CASCADE
        // Finalmente eliminar la póliza
        await tx.policy.delete({ where: { id } })
      })

      // Retornar un objeto con la estructura esperada
      return {
        id: policy.id,
        policyNumber: policy.policyNumber,
        status: 'ELIMINADA' as any
      }
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
    const policy = await prisma.policy.findUnique({
      where: { id },
      include: {
        payments: true,
        claims: true,
        commissions: true,
        renewals: true,
        notifications: true,
        endorsements: true,
      },
    })

    if (!policy) {
      throw new Error('Póliza no encontrada')
    }

    if (policy.status !== 'CANCELADA') {
      throw new Error('Solo se pueden eliminar permanentemente pólizas canceladas')
    }

    const deleted = {
      notifications: 0,
      renewals: 0,
      commissions: 0,
      payments: 0,
      claims: 0,
      endorsements: 0,
    }

    await prisma.$transaction(async (tx) => {
      // Eliminar notificaciones
      const notifResult = await tx.notification.deleteMany({ where: { policyId: id } })
      deleted.notifications = notifResult.count

      // Eliminar renovaciones
      const renewalResult = await tx.renewal.deleteMany({ where: { policyId: id } })
      deleted.renewals = renewalResult.count

      // Eliminar comisiones
      const commResult = await tx.commission.deleteMany({ where: { policyId: id } })
      deleted.commissions = commResult.count

      // Eliminar pagos
      const payResult = await tx.payment.deleteMany({ where: { policyId: id } })
      deleted.payments = payResult.count

      // Eliminar notas de siniestros
      await tx.claimNote.deleteMany({
        where: { claim: { policyId: id } },
      })

      // Eliminar siniestros
      const claimResult = await tx.claim.deleteMany({ where: { policyId: id } })
      deleted.claims = claimResult.count

      // Eliminar endosos
      const endorResult = await tx.endorsement.deleteMany({ where: { policyId: id } })
      deleted.endorsements = endorResult.count

      // Eliminar la póliza
      await tx.policy.delete({ where: { id } })
    })

    return {
      id: policy.id,
      policyNumber: policy.policyNumber,
      deleted,
    }
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
