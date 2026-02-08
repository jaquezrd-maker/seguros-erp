import prisma from '../../config/database'
import { PaymentStatus } from '@prisma/client'

interface PaymentFilters {
  clientId?: number
  policyId?: number
  status?: string
  page?: number
  limit?: number
}

interface CreatePaymentInput {
  policyId: number
  clientId: number
  amount: number
  paymentMethod: string
  paymentDate: string
  dueDate?: string | null
  receiptNumber?: string | null
  notes?: string | null
  createdBy?: number
}

interface UpdatePaymentInput {
  policyId?: number
  clientId?: number
  amount?: number
  paymentMethod?: string
  paymentDate?: string
  dueDate?: string | null
  receiptNumber?: string | null
  status?: string
  notes?: string | null
}

export class PaymentsService {
  async findAll(filters: PaymentFilters) {
    const { clientId, policyId, status, page = 1, limit = 20 } = filters
    const skip = (page - 1) * limit

    const where: any = {}
    if (clientId) where.clientId = clientId
    if (policyId) where.policyId = policyId
    if (status) where.status = status
    
    // Exclude payments from cancelled policies
    where.policy = {
      status: {
        not: 'CANCELADA'
      }
    }

    const [data, total, completedSum, pendingSum, completedCount] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          policy: {
            select: { id: true, policyNumber: true, status: true },
          },
          client: {
            select: { id: true, name: true, cedulaRnc: true },
          },
          creator: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
      prisma.payment.aggregate({
        where: { ...where, status: 'COMPLETADO' },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { ...where, status: 'PENDIENTE' },
        _sum: { amount: true },
      }),
      prisma.payment.count({ where: { ...where, status: 'COMPLETADO' } }),
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
        totalCobrado: Number(completedSum._sum.amount || 0),
        totalPendiente: Number(pendingSum._sum.amount || 0),
        completedCount,
      },
    }
  }

  async findById(id: number) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        policy: {
          select: {
            id: true,
            policyNumber: true,
            status: true,
            premium: true,
            paymentMethod: true,
          },
        },
        client: {
          select: { id: true, name: true, cedulaRnc: true, email: true, phone: true },
        },
        creator: {
          select: { id: true, name: true },
        },
      },
    })

    if (!payment) {
      throw new Error('Pago no encontrado')
    }

    return payment
  }

  async create(input: CreatePaymentInput) {
    // Auto-generate receipt number if not provided
    let receiptNumber = input.receiptNumber
    if (!receiptNumber) {
      const lastPayment = await prisma.payment.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { receiptNumber: true },
      })

      const lastNumber = lastPayment?.receiptNumber
        ? parseInt(lastPayment.receiptNumber.replace(/\D/g, '')) || 0
        : 0

      receiptNumber = `REC-${String(lastNumber + 1).padStart(6, '0')}`
    }

    // Determinar el status:
    // - Si tiene dueDate y es futura: PENDIENTE (es una cuota programada)
    // - Si no tiene dueDate o la dueDate es pasada/hoy: COMPLETADO (es un pago que se está registrando)
    const paymentDate = new Date(input.paymentDate)
    const dueDate = input.dueDate ? new Date(input.dueDate) : null
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let status: 'PENDIENTE' | 'COMPLETADO' = 'COMPLETADO'
    if (dueDate) {
      const dueDateOnly = new Date(dueDate)
      dueDateOnly.setHours(0, 0, 0, 0)
      if (dueDateOnly > today) {
        status = 'PENDIENTE'
      }
    }

    const payment = await prisma.payment.create({
      data: {
        policyId: input.policyId,
        clientId: input.clientId,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        paymentDate: paymentDate,
        dueDate: dueDate,
        receiptNumber,
        notes: input.notes || null,
        createdBy: input.createdBy || null,
        status,
      },
      include: {
        policy: {
          select: { id: true, policyNumber: true },
        },
        client: {
          select: { id: true, name: true },
        },
      },
    })

    return payment
  }

  async update(id: number, input: UpdatePaymentInput) {
    const existing = await prisma.payment.findUnique({ where: { id } })
    if (!existing) {
      throw new Error('Pago no encontrado')
    }

    const data: any = {}
    if (input.policyId !== undefined) data.policyId = input.policyId
    if (input.clientId !== undefined) data.clientId = input.clientId
    if (input.amount !== undefined) data.amount = input.amount
    if (input.paymentMethod !== undefined) data.paymentMethod = input.paymentMethod
    if (input.paymentDate !== undefined) data.paymentDate = new Date(input.paymentDate)
    if (input.dueDate !== undefined) data.dueDate = input.dueDate ? new Date(input.dueDate) : null
    if (input.receiptNumber !== undefined) data.receiptNumber = input.receiptNumber
    if (input.status !== undefined) data.status = input.status
    if (input.notes !== undefined) data.notes = input.notes

    const payment = await prisma.payment.update({
      where: { id },
      data,
      include: {
        policy: {
          select: { id: true, policyNumber: true },
        },
        client: {
          select: { id: true, name: true },
        },
      },
    })

    return payment
  }

  async delete(id: number) {
    const existing = await prisma.payment.findUnique({
      where: { id },
      include: {
        policy: {
          select: {
            id: true,
            policyNumber: true,
            premium: true,
            payments: {
              where: {
                status: { in: ['PENDIENTE', 'COMPLETADO'] }
              },
              select: {
                id: true,
                amount: true
              }
            }
          }
        }
      }
    })

    if (!existing) {
      throw new Error('Pago no encontrado')
    }

    // Validar que anular este pago no cause descuadre con la prima de la póliza
    if (existing.policy) {
      const policyPremium = Number(existing.policy.premium)

      // Calcular total de pagos activos SIN incluir el pago que se va a anular
      const activePaymentsTotal = existing.policy.payments
        .filter(p => p.id !== id) // Excluir el pago que se va a anular
        .reduce((sum, p) => sum + Number(p.amount), 0)

      // Si el total de pagos activos es menor que la prima, no permitir anular
      if (activePaymentsTotal < policyPremium) {
        const shortage = policyPremium - activePaymentsTotal
        throw new Error(
          `No se puede anular este pago. La póliza ${existing.policy.policyNumber} tiene una prima de ${policyPremium.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })} y solo quedarían ${activePaymentsTotal.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })} en pagos activos (faltarían ${shortage.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}). Debe crear los pagos faltantes antes de anular este.`
        )
      }
    }

    // Soft delete: set status to ANULADO
    return prisma.payment.update({
      where: { id },
      data: { status: 'ANULADO' },
      include: {
        policy: { select: { id: true, policyNumber: true } },
        client: { select: { id: true, name: true } },
      },
    })
  }

  async getOverdue() {
    const now = new Date()

    const payments = await prisma.payment.findMany({
      where: {
        status: 'PENDIENTE',
        dueDate: {
          lt: now,
        },
      },
      include: {
        policy: {
          select: { id: true, policyNumber: true, status: true },
        },
        client: {
          select: { id: true, name: true, cedulaRnc: true, email: true, phone: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    })

    return payments
  }

  async getUpcoming(days: number = 15) {
    const now = new Date()
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    const payments = await prisma.payment.findMany({
      where: {
        status: 'PENDIENTE',
        dueDate: {
          gte: now,
          lte: futureDate,
        },
        policy: {
          status: {
            not: 'CANCELADA'
          }
        }
      },
      include: {
        policy: {
          select: { id: true, policyNumber: true, status: true },
        },
        client: {
          select: { id: true, name: true, cedulaRnc: true, email: true, phone: true },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    })

    return payments
  }

  async getReceivables() {
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: 'PENDIENTE',
      },
      include: {
        policy: {
          select: { id: true, policyNumber: true },
        },
        client: {
          select: { id: true, name: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    })

    const totalReceivable = pendingPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    )

    return {
      totalReceivable,
      count: pendingPayments.length,
      payments: pendingPayments,
    }
  }

  async regenerateMissingPayments(policyId: number, userId?: number) {
    // Obtener la póliza con todos sus pagos activos
    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
      include: {
        payments: {
          where: {
            status: { in: ['PENDIENTE', 'COMPLETADO'] }
          }
        }
      }
    })

    if (!policy) {
      throw new Error('Póliza no encontrada')
    }

    if (policy.status === 'CANCELADA') {
      throw new Error('No se pueden regenerar pagos para una póliza cancelada')
    }

    const premium = Number(policy.premium)

    // Calcular total de pagos activos existentes
    const existingPaymentsTotal = policy.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    )

    // Si ya está cuadrado, no hacer nada
    if (existingPaymentsTotal >= premium) {
      return {
        created: 0,
        message: 'La póliza ya tiene todos los pagos necesarios'
      }
    }

    // Calcular cuánto falta
    const shortage = premium - existingPaymentsTotal

    // Determinar cuántos pagos crear según el método de pago
    const paymentMethodMap: Record<string, number> = {
      'MENSUAL': 12,
      'TRIMESTRAL': 4,
      'SEMESTRAL': 2,
      'ANUAL': 1
    }

    const totalPaymentsNeeded = paymentMethodMap[policy.paymentMethod] || 1
    const paymentAmount = premium / totalPaymentsNeeded
    const paymentsToCreate = Math.round(shortage / paymentAmount)

    if (paymentsToCreate <= 0) {
      return {
        created: 0,
        message: 'No es necesario crear pagos adicionales'
      }
    }

    // Determinar la última fecha de vencimiento existente
    const lastPayment = policy.payments
      .filter(p => p.dueDate)
      .sort((a, b) => new Date(b.dueDate!).getTime() - new Date(a.dueDate!).getTime())[0]

    let nextDueDate: Date
    if (lastPayment?.dueDate) {
      nextDueDate = new Date(lastPayment.dueDate)
    } else {
      nextDueDate = new Date(policy.startDate)
    }

    // Incremento de meses según método de pago
    const monthsIncrement: Record<string, number> = {
      'MENSUAL': 1,
      'TRIMESTRAL': 3,
      'SEMESTRAL': 6,
      'ANUAL': 12
    }

    const increment = monthsIncrement[policy.paymentMethod] || 1

    // Crear los pagos faltantes
    const newPayments = []
    for (let i = 0; i < paymentsToCreate; i++) {
      nextDueDate = new Date(nextDueDate)
      nextDueDate.setMonth(nextDueDate.getMonth() + increment)

      // No crear pagos con vencimiento después del final de la póliza
      if (nextDueDate > new Date(policy.endDate)) {
        break
      }

      newPayments.push({
        policyId: policy.id,
        clientId: policy.clientId,
        amount: paymentAmount,
        paymentMethod: policy.paymentMethod,
        paymentDate: new Date(), // Se actualizará cuando se complete el pago
        dueDate: nextDueDate,
        status: PaymentStatus.PENDIENTE,
        createdBy: userId
      })
    }

    // Insertar los pagos en la base de datos
    await prisma.payment.createMany({
      data: newPayments
    })

    return {
      created: newPayments.length,
      message: `Se crearon ${newPayments.length} pago(s) por ${paymentAmount.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })} cada uno para completar la prima de la póliza`
    }
  }
}
