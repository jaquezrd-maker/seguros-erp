import prisma from '../../config/database'

export class AIService {
  async getClientInsights(clientId?: number) {
    // Get client analytics
    const [
      totalClients,
      activeClients,
      clientsWithPolicies,
      clientsWithoutPolicies,
      policiesData,
      paymentsData,
      claimsData,
    ] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { status: 'ACTIVO' } }),
      prisma.client.count({
        where: {
          policies: {
            some: {},
          },
        },
      }),
      prisma.client.count({
        where: {
          policies: {
            none: {},
          },
        },
      }),
      prisma.policy.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.payment.groupBy({
        by: ['status'],
        where: clientId ? { clientId } : {},
        _count: true,
        _sum: {
          amount: true,
        },
      }),
      prisma.claim.groupBy({
        by: ['status'],
        where: clientId ? { policy: { clientId } } : {},
        _count: true,
      }),
    ])

    return {
      clients: {
        total: totalClients,
        active: activeClients,
        withPolicies: clientsWithPolicies,
        withoutPolicies: clientsWithoutPolicies,
      },
      policies: policiesData.reduce((acc: any, item) => {
        acc[item.status.toLowerCase()] = item._count
        return acc
      }, {}),
      payments: paymentsData.reduce((acc: any, item) => {
        acc[item.status.toLowerCase()] = {
          count: item._count,
          total: Number(item._sum.amount || 0),
        }
        return acc
      }, {}),
      claims: claimsData.reduce((acc: any, item) => {
        acc[item.status.toLowerCase()] = item._count
        return acc
      }, {}),
    }
  }

  async getClientSuggestions(clientId: number) {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        policies: {
          include: {
            insuranceType: true,
            insurer: true,
          },
        },
        payments: {
          where: {
            status: 'PENDIENTE',
          },
          orderBy: {
            dueDate: 'asc',
          },
        },
      },
    })

    if (!client) {
      throw new Error('Cliente no encontrado')
    }

    const suggestions = []

    // Check for clients without policies
    if (client.policies.length === 0) {
      suggestions.push({
        type: 'new_policy',
        priority: 'high',
        title: 'Cliente sin pólizas',
        description: 'Este cliente no tiene pólizas activas. Considera ofrecer productos de seguros.',
        action: 'Contactar para ofrecer productos',
      })
    }

    // Check for expiring policies
    const expiringPolicies = client.policies.filter((p) => {
      const daysToExpire = Math.ceil(
        (new Date(p.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      return p.status === 'VIGENTE' && daysToExpire > 0 && daysToExpire <= 30
    })

    if (expiringPolicies.length > 0) {
      suggestions.push({
        type: 'renewal',
        priority: 'high',
        title: `${expiringPolicies.length} póliza(s) próxima(s) a vencer`,
        description: 'Contactar al cliente para renovación de pólizas.',
        action: 'Iniciar proceso de renovación',
        policies: expiringPolicies.map((p) => p.policyNumber),
      })
    }

    // Check for pending payments
    if (client.payments.length > 0) {
      const overduePayments = client.payments.filter(
        (p) => p.dueDate && new Date(p.dueDate) < new Date()
      )
      if (overduePayments.length > 0) {
        suggestions.push({
          type: 'payment_overdue',
          priority: 'critical',
          title: `${overduePayments.length} pago(s) vencido(s)`,
          description: 'Cliente con pagos vencidos. Contactar urgentemente.',
          action: 'Recordatorio de pago',
          amount: overduePayments.reduce((sum, p) => sum + Number(p.amount), 0),
        })
      }
    }

    // Cross-sell suggestions based on existing policies
    const insuranceTypes = client.policies.map((p) => p.insuranceType?.name).filter(Boolean)
    const crossSellOpportunities = []

    if (insuranceTypes.includes('Vehículos') && !insuranceTypes.includes('Vida')) {
      crossSellOpportunities.push('Seguro de Vida')
    }
    if (insuranceTypes.includes('Propiedad') && !insuranceTypes.includes('Salud')) {
      crossSellOpportunities.push('Seguro de Salud')
    }

    if (crossSellOpportunities.length > 0) {
      suggestions.push({
        type: 'cross_sell',
        priority: 'medium',
        title: 'Oportunidad de venta cruzada',
        description: `El cliente podría estar interesado en: ${crossSellOpportunities.join(', ')}`,
        action: 'Ofrecer productos adicionales',
        products: crossSellOpportunities,
      })
    }

    // Check client activity
    const lastPolicy = client.policies.sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    )[0]

    if (lastPolicy) {
      const daysSinceLastPolicy = Math.ceil(
        (Date.now() - new Date(lastPolicy.startDate).getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSinceLastPolicy > 365) {
        suggestions.push({
          type: 'inactive_client',
          priority: 'medium',
          title: 'Cliente inactivo',
          description: `No ha contratado nuevas pólizas en ${Math.floor(daysSinceLastPolicy / 30)} meses.`,
          action: 'Contactar para reactivación',
        })
      }
    }

    return suggestions
  }

  async getOverallSuggestions() {
    const [clientsWithoutPolicies, expiringPolicies, overduePayments, pendingClaims] =
      await Promise.all([
        prisma.client.findMany({
          where: {
            policies: {
              none: {},
            },
            status: 'ACTIVO',
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
          take: 10,
        }),
        prisma.policy.findMany({
          where: {
            status: 'VIGENTE',
            endDate: {
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              gte: new Date(),
            },
          },
          include: {
            client: {
              select: { id: true, name: true },
            },
          },
          take: 10,
        }),
        prisma.payment.findMany({
          where: {
            status: 'PENDIENTE',
            dueDate: {
              lt: new Date(),
            },
            policy: {
              status: {
                not: 'CANCELADA',
              },
            },
          },
          include: {
            client: {
              select: { id: true, name: true },
            },
            policy: {
              select: { policyNumber: true },
            },
          },
          take: 10,
        }),
        prisma.claim.findMany({
          where: {
            status: 'PENDIENTE',
          },
          include: {
            policy: {
              include: {
                client: {
                  select: { id: true, name: true },
                },
              },
            },
          },
          take: 10,
        }),
      ])

    return {
      clientsWithoutPolicies: {
        count: clientsWithoutPolicies.length,
        clients: clientsWithoutPolicies,
      },
      expiringPolicies: {
        count: expiringPolicies.length,
        policies: expiringPolicies,
      },
      overduePayments: {
        count: overduePayments.length,
        payments: overduePayments,
      },
      pendingClaims: {
        count: pendingClaims.length,
        claims: pendingClaims,
      },
    }
  }

  async getPolicyStats() {
    const [statusStats, monthlyStats] = await Promise.all([
      prisma.policy.groupBy({
        by: ['status'],
        _count: true,
        _sum: {
          premium: true,
        },
      }),
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', start_date) as month,
          COUNT(*) as count,
          SUM(premium) as total_premium
        FROM policies
        WHERE start_date >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', start_date)
        ORDER BY month DESC
      `,
    ])

    return {
      byStatus: statusStats.map((s) => ({
        status: s.status,
        count: s._count,
        totalPremium: Number(s._sum.premium || 0),
      })),
      byMonth: monthlyStats,
    }
  }
}
