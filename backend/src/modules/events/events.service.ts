import prisma from '../../config/database'
import { EventType } from '@prisma/client'
import { getTenantContext } from '../../middleware/tenant-isolation.middleware'

interface EventFilters {
  startDate?: Date
  endDate?: Date
  type?: EventType
  userId?: number
  page?: number
  limit?: number
}

interface CreateEventInput {
  title: string
  description?: string
  startDate: Date
  endDate?: Date
  allDay?: boolean
  type: EventType
  color?: string
  userId: number
  companyId?: number
  policyId?: number
  clientId?: number
}

interface UpdateEventInput {
  title?: string
  description?: string
  startDate?: Date
  endDate?: Date
  allDay?: boolean
  type?: EventType
  color?: string
  policyId?: number
  clientId?: number
}

export class EventsService {
  async findAll(filters: EventFilters) {
    const { startDate, endDate, type, userId, page = 1, limit = 100 } = filters
    const skip = (page - 1) * limit

    // Get tenant context for company filtering
    const tenantContext = getTenantContext()
    const companyId = tenantContext.companyId

    const where: any = {}

    // Filter by company if not bypassing (SUPER_ADMIN in global view)
    if (companyId && !tenantContext.bypassTenantCheck) {
      where.companyId = companyId
    }

    // Filter by date range
    if (startDate && endDate) {
      where.OR = [
        {
          AND: [
            { startDate: { gte: startDate } },
            { startDate: { lte: endDate } },
          ],
        },
        {
          AND: [
            { endDate: { gte: startDate } },
            { endDate: { lte: endDate } },
          ],
        },
        {
          AND: [
            { startDate: { lte: startDate } },
            { endDate: { gte: endDate } },
          ],
        },
      ]
    } else if (startDate) {
      where.startDate = { gte: startDate }
    } else if (endDate) {
      where.endDate = { lte: endDate }
    }

    if (type) {
      where.type = type
    }

    if (userId) {
      where.userId = userId
    }

    const [data, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          policy: {
            select: {
              id: true,
              policyNumber: true,
              client: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          client: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { startDate: 'asc' },
        skip,
        take: limit,
      }),
      prisma.event.count({ where }),
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
    // Get tenant context for company filtering
    const tenantContext = getTenantContext()
    const companyId = tenantContext.companyId

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        policy: {
          select: {
            id: true,
            policyNumber: true,
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!event) {
      throw new Error('Evento no encontrado')
    }

    // Verify event belongs to user's company (unless bypassing for SUPER_ADMIN)
    if (companyId && !tenantContext.bypassTenantCheck && event.companyId !== companyId) {
      throw new Error('Evento no encontrado')
    }

    return event
  }

  async create(input: CreateEventInput) {
    // Validate companyId is provided
    if (!input.companyId) {
      throw new Error('No se puede crear un evento sin contexto de empresa')
    }

    const event = await prisma.event.create({
      data: {
        title: input.title,
        description: input.description || null,
        startDate: input.startDate,
        endDate: input.endDate || null,
        allDay: input.allDay || false,
        type: input.type,
        color: input.color || null,
        userId: input.userId,
        companyId: input.companyId,
        policyId: input.policyId || null,
        clientId: input.clientId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        policy: {
          select: {
            id: true,
            policyNumber: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return event
  }

  async update(id: number, input: UpdateEventInput) {
    // Get tenant context for company filtering
    const tenantContext = getTenantContext()
    const companyId = tenantContext.companyId

    const existing = await prisma.event.findUnique({ where: { id } })

    if (!existing) {
      throw new Error('Evento no encontrado')
    }

    // Verify event belongs to user's company (unless bypassing for SUPER_ADMIN)
    if (companyId && !tenantContext.bypassTenantCheck && existing.companyId !== companyId) {
      throw new Error('Evento no encontrado')
    }

    const data: any = {}
    if (input.title !== undefined) data.title = input.title
    if (input.description !== undefined) data.description = input.description
    if (input.startDate !== undefined) data.startDate = input.startDate
    if (input.endDate !== undefined) data.endDate = input.endDate
    if (input.allDay !== undefined) data.allDay = input.allDay
    if (input.type !== undefined) data.type = input.type
    if (input.color !== undefined) data.color = input.color
    if (input.policyId !== undefined) data.policyId = input.policyId
    if (input.clientId !== undefined) data.clientId = input.clientId

    const event = await prisma.event.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        policy: {
          select: {
            id: true,
            policyNumber: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return event
  }

  async delete(id: number) {
    // Get tenant context for company filtering
    const tenantContext = getTenantContext()
    const companyId = tenantContext.companyId

    const existing = await prisma.event.findUnique({ where: { id } })

    if (!existing) {
      throw new Error('Evento no encontrado')
    }

    // Verify event belongs to user's company (unless bypassing for SUPER_ADMIN)
    if (companyId && !tenantContext.bypassTenantCheck && existing.companyId !== companyId) {
      throw new Error('Evento no encontrado')
    }

    return prisma.event.delete({ where: { id } })
  }

  // Get calendar events including policy expirations and payment due dates
  async getCalendarEvents(startDate: Date, endDate: Date, userId?: number) {
    // Get tenant context for company filtering
    const tenantContext = getTenantContext()
    const companyId = tenantContext.companyId

    // Get custom events
    const eventsWhere: any = {
      OR: [
        {
          AND: [
            { startDate: { gte: startDate } },
            { startDate: { lte: endDate } },
          ],
        },
        {
          AND: [
            { endDate: { gte: startDate } },
            { endDate: { lte: endDate } },
          ],
        },
      ],
    }

    // Filter by company if not bypassing (SUPER_ADMIN in global view)
    if (companyId && !tenantContext.bypassTenantCheck) {
      eventsWhere.companyId = companyId
    }

    if (userId) {
      eventsWhere.userId = userId
    }

    const customEvents = await prisma.event.findMany({
      where: eventsWhere,
      include: {
        policy: {
          select: {
            policyNumber: true,
            client: { select: { name: true } },
          },
        },
        client: {
          select: { name: true },
        },
      },
    })

    // Get policy expirations
    const policyWhere: any = {
      endDate: {
        gte: startDate,
        lte: endDate,
      },
      status: 'VIGENTE',
    }

    // Filter by company if not bypassing
    if (companyId && !tenantContext.bypassTenantCheck) {
      policyWhere.companyId = companyId
    }

    const expiringPolicies = await prisma.policy.findMany({
      where: policyWhere,
      include: {
        client: {
          select: { name: true },
        },
        insurer: {
          select: { name: true },
        },
      },
    })

    // Get payment due dates
    const paymentWhere: any = {
      dueDate: {
        gte: startDate,
        lte: endDate,
      },
      status: 'PENDIENTE',
    }

    // Filter by company if not bypassing
    if (companyId && !tenantContext.bypassTenantCheck) {
      paymentWhere.companyId = companyId
    }

    const upcomingPayments = await prisma.payment.findMany({
      where: paymentWhere,
      include: {
        client: {
          select: { name: true },
        },
        policy: {
          select: { policyNumber: true },
        },
      },
    })

    // Format events for calendar
    const events = [
      ...customEvents.map((e) => ({
        id: `event-${e.id}`,
        title: e.title,
        start: e.startDate,
        end: e.endDate || e.startDate,
        allDay: e.allDay,
        type: e.type,
        color: e.color,
        description: e.description,
        entityType: 'event' as const,
        entityId: e.id,
        policyNumber: e.policy?.policyNumber,
        clientName: e.client?.name || e.policy?.client?.name,
      })),
      ...expiringPolicies.map((p) => ({
        id: `policy-${p.id}`,
        title: `Vencimiento: ${p.client.name}`,
        start: p.endDate,
        end: p.endDate,
        allDay: true,
        type: 'POLICY_EXPIRATION' as const,
        color: '#ef4444',
        description: `Póliza ${p.policyNumber} - ${p.insurer.name}`,
        entityType: 'policy' as const,
        entityId: p.id,
        policyNumber: p.policyNumber,
        clientName: p.client.name,
      })),
      ...upcomingPayments.map((p) => ({
        id: `payment-${p.id}`,
        title: `Pago: ${p.client?.name || 'Sin cliente'}`,
        start: p.dueDate!,
        end: p.dueDate!,
        allDay: true,
        type: 'PAYMENT_DUE' as const,
        color: '#f59e0b',
        description: `${p.policy?.policyNumber || 'Sin póliza'} - RD$ ${p.amount}`,
        entityType: 'payment' as const,
        entityId: p.id,
        policyNumber: p.policy?.policyNumber,
        clientName: p.client?.name,
      })),
    ]

    return events.sort((a, b) => a.start.getTime() - b.start.getTime())
  }
}
