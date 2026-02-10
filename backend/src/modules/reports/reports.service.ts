import prisma from '../../config/database'

export class ReportsService {
  async getDashboard() {
    const [
      totalClients,
      totalPolicies,
      activePolicies,
      totalClaims,
      pendingClaims,
      pendingPayments,
      completedPaymentsAgg,
      pendingCommissionsAgg,
      paidCommissionsAgg,
      totalPremiumAgg,
      pendingRenewals,
      claimsAmountAgg,
    ] = await Promise.all([
      prisma.client.count({ where: { status: 'ACTIVO' } }),
      prisma.policy.count(),
      prisma.policy.count({ where: { status: 'VIGENTE' } }),
      prisma.claim.count(),
      prisma.claim.count({
        where: { status: { in: ['PENDIENTE', 'EN_PROCESO', 'EN_REVISION'] } },
      }),
      prisma.payment.count({ where: { status: 'PENDIENTE' } }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETADO' },
        _sum: { amount: true },
      }),
      prisma.commission.aggregate({
        where: { status: 'PENDIENTE' },
        _sum: { amount: true },
      }),
      prisma.commission.aggregate({
        where: { status: 'PAGADA' },
        _sum: { amount: true },
      }),
      prisma.policy.aggregate({
        where: { status: 'VIGENTE' },
        _sum: { premium: true },
      }),
      prisma.renewal.count({ where: { status: 'PENDIENTE' } }),
      prisma.claim.aggregate({
        _sum: { 
          estimatedAmount: true,
        },
      }),
    ])

    // Monthly revenue: completed payments in the current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const monthlyRevenueAgg = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETADO',
        paymentDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { amount: true },
    })

    // Calculate total claims amount from estimated amounts
    const totalClaimsAmount = Number(claimsAmountAgg._sum.estimatedAmount || 0)

    return {
      totalClients,
      totalPolicies,
      activePolicies,
      totalClaims,
      pendingClaims,
      totalClaimsAmount,
      pendingPayments,
      monthlyRevenue: Number(monthlyRevenueAgg._sum.amount || 0),
      totalRevenue: Number(completedPaymentsAgg._sum.amount || 0),
      totalPremium: Number(totalPremiumAgg._sum.premium || 0),
      pendingCommissions: Number(pendingCommissionsAgg._sum.amount || 0),
      paidCommissions: Number(paidCommissionsAgg._sum.amount || 0),
      totalCommissions: Number(pendingCommissionsAgg._sum.amount || 0) + Number(paidCommissionsAgg._sum.amount || 0),
      pendingRenewals,
    }
  }

  async getSalesByPeriod(startDate: string, endDate: string) {
    const start = new Date(startDate)
    const end = new Date(endDate)

    const policies = await prisma.policy.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
        insurer: {
          select: { id: true, name: true },
        },
        insuranceType: {
          select: { id: true, name: true },
        },
        creator: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const totalPremium = policies.reduce(
      (sum, p) => sum + Number(p.premium),
      0
    )

    // Group by insurer
    const byInsurer: Record<string, { count: number; totalPremium: number }> = {}
    for (const policy of policies) {
      const name = policy.insurer.name
      if (!byInsurer[name]) {
        byInsurer[name] = { count: 0, totalPremium: 0 }
      }
      byInsurer[name].count++
      byInsurer[name].totalPremium += Number(policy.premium)
    }

    // Group by insurance type
    const byType: Record<string, { count: number; totalPremium: number }> = {}
    for (const policy of policies) {
      const name = policy.insuranceType.name
      if (!byType[name]) {
        byType[name] = { count: 0, totalPremium: 0 }
      }
      byType[name].count++
      byType[name].totalPremium += Number(policy.premium)
    }

    return {
      period: { startDate, endDate },
      totalPolicies: policies.length,
      totalPremium,
      byInsurer: Object.entries(byInsurer).map(([name, data]) => ({
        name,
        count: data.count,
        premium: data.totalPremium,
      })),
      byType: Object.entries(byType).map(([name, data]) => ({
        name,
        count: data.count,
        premium: data.totalPremium,
      })),
      policies,
    }
  }

  async getCommissionsByPeriod(startDate: string, endDate: string) {
    const start = new Date(startDate)
    const end = new Date(endDate)

    const commissions = await prisma.commission.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        policy: {
          select: {
            id: true,
            policyNumber: true,
            client: {
              select: { id: true, name: true },
            },
          },
        },
        producer: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const totalAmount = commissions.reduce(
      (sum, c) => sum + Number(c.amount),
      0
    )
    const totalPending = commissions
      .filter((c) => c.status === 'PENDIENTE')
      .reduce((sum, c) => sum + Number(c.amount), 0)
    const totalPaid = commissions
      .filter((c) => c.status === 'PAGADA')
      .reduce((sum, c) => sum + Number(c.amount), 0)

    // Group by producer
    const byProducer: Record<string, { count: number; totalAmount: number; pending: number; paid: number }> = {}
    for (const commission of commissions) {
      const name = commission.producer.name
      if (!byProducer[name]) {
        byProducer[name] = { count: 0, totalAmount: 0, pending: 0, paid: 0 }
      }
      byProducer[name].count++
      byProducer[name].totalAmount += Number(commission.amount)
      if (commission.status === 'PENDIENTE') {
        byProducer[name].pending += Number(commission.amount)
      } else if (commission.status === 'PAGADA') {
        byProducer[name].paid += Number(commission.amount)
      }
    }

    return {
      period: { startDate, endDate },
      totalCommissions: commissions.length,
      totalAmount,
      totalPending,
      totalPaid,
      byProducer: Object.entries(byProducer).map(([name, data]) => ({
        name,
        amount: data.totalAmount,
        paid: data.paid,
        pending: data.pending,
      })),
      commissions,
    }
  }

  async getClaimsReport(startDate?: string, endDate?: string) {
    const where: any = {}
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const claims = await prisma.claim.findMany({
      where,
      include: {
        policy: {
          select: {
            id: true,
            policyNumber: true,
            client: {
              select: { id: true, name: true },
            },
            insurer: {
              select: { id: true, name: true },
            },
          },
        },
        assignee: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const totalEstimated = claims.reduce(
      (sum, c) => sum + Number(c.estimatedAmount || 0),
      0
    )
    const totalApproved = claims.reduce(
      (sum, c) => sum + Number(c.approvedAmount || 0),
      0
    )

    const byStatus: Record<string, { count: number; amount: number }> = {}
    for (const claim of claims) {
      if (!byStatus[claim.status]) {
        byStatus[claim.status] = { count: 0, amount: 0 }
      }
      byStatus[claim.status].count++
      byStatus[claim.status].amount += Number(claim.estimatedAmount || 0)
    }

    return {
      totalClaims: claims.length,
      totalEstimated,
      totalApproved,
      byStatus: Object.entries(byStatus).map(([status, data]) => ({
        status,
        count: data.count,
        amount: data.amount,
      })),
      claims,
    }
  }

  async getProductionByPeriod(year: number, groupBy: 'month' | 'year' = 'month') {
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31, 23, 59, 59)

    const policies = await prisma.policy.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        insurer: {
          select: { id: true, name: true },
        },
        insuranceType: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    if (groupBy === 'month') {
      // Group by month
      const byMonth: Record<string, { count: number; premium: number; policies: any[] }> = {}

      for (let month = 0; month < 12; month++) {
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
        byMonth[monthKey] = { count: 0, premium: 0, policies: [] }
      }

      for (const policy of policies) {
        const month = policy.createdAt.getMonth()
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`

        byMonth[monthKey].count++
        byMonth[monthKey].premium += Number(policy.premium)
        byMonth[monthKey].policies.push(policy)
      }

      return {
        year,
        groupBy: 'month',
        totalPolicies: policies.length,
        totalPremium: policies.reduce((sum, p) => sum + Number(p.premium), 0),
        data: Object.entries(byMonth).map(([month, data]) => ({
          period: month,
          count: data.count,
          premium: data.premium,
        })),
      }
    } else {
      // Group by year (single year summary)
      return {
        year,
        groupBy: 'year',
        totalPolicies: policies.length,
        totalPremium: policies.reduce((sum, p) => sum + Number(p.premium), 0),
        data: [{
          period: year.toString(),
          count: policies.length,
          premium: policies.reduce((sum, p) => sum + Number(p.premium), 0),
        }],
      }
    }
  }

  async getNewVsRenewedClients(startDate: string, endDate: string) {
    const start = new Date(startDate)
    const end = new Date(endDate)

    // Get all policies in the period
    const policiesInPeriod = await prisma.policy.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        client: {
          select: { id: true, name: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Get unique clients from these policies
    const clientIds = [...new Set(policiesInPeriod.map(p => p.clientId))]

    // For each client, check if they had policies before this period
    const clientAnalysis = await Promise.all(
      clientIds.map(async (clientId) => {
        const client = policiesInPeriod.find(p => p.clientId === clientId)?.client

        // Count policies before the period
        const policiesBeforePeriod = await prisma.policy.count({
          where: {
            clientId,
            createdAt: {
              lt: start,
            },
          },
        })

        // Count policies in the period
        const policiesInThisPeriod = policiesInPeriod.filter(p => p.clientId === clientId).length
        const premiumInPeriod = policiesInPeriod
          .filter(p => p.clientId === clientId)
          .reduce((sum, p) => sum + Number(p.premium), 0)

        return {
          clientId,
          clientName: client?.name || 'Unknown',
          isNew: policiesBeforePeriod === 0,
          policiesInPeriod: policiesInThisPeriod,
          premiumInPeriod,
        }
      })
    )

    const newClients = clientAnalysis.filter(c => c.isNew)
    const renewedClients = clientAnalysis.filter(c => !c.isNew)

    return {
      period: { startDate, endDate },
      summary: {
        totalClients: clientAnalysis.length,
        newClients: newClients.length,
        renewedClients: renewedClients.length,
        newClientsPremium: newClients.reduce((sum, c) => sum + c.premiumInPeriod, 0),
        renewedClientsPremium: renewedClients.reduce((sum, c) => sum + c.premiumInPeriod, 0),
        retentionRate: clientAnalysis.length > 0
          ? ((renewedClients.length / clientAnalysis.length) * 100).toFixed(2)
          : 0,
      },
      newClients: newClients.map(c => ({
        id: c.clientId,
        name: c.clientName,
        policies: c.policiesInPeriod,
        premium: c.premiumInPeriod,
      })),
      renewedClients: renewedClients.map(c => ({
        id: c.clientId,
        name: c.clientName,
        policies: c.policiesInPeriod,
        premium: c.premiumInPeriod,
      })),
    }
  }

  async getTopInsurers(startDate: string, endDate: string, limit: number = 10) {
    const start = new Date(startDate)
    const end = new Date(endDate)

    const policies = await prisma.policy.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        insurer: {
          select: { id: true, name: true },
        },
        commissions: {
          select: { amount: true },
        },
      },
    })

    // Group by insurer
    const byInsurer: Record<number, {
      id: number
      name: string
      policies: number
      premium: number
      commissions: number
    }> = {}

    for (const policy of policies) {
      const insurerId = policy.insurer.id
      if (!byInsurer[insurerId]) {
        byInsurer[insurerId] = {
          id: insurerId,
          name: policy.insurer.name,
          policies: 0,
          premium: 0,
          commissions: 0,
        }
      }
      byInsurer[insurerId].policies++
      byInsurer[insurerId].premium += Number(policy.premium)
      byInsurer[insurerId].commissions += policy.commissions.reduce(
        (sum, c) => sum + Number(c.amount),
        0
      )
    }

    // Sort by premium (most profitable) and limit
    const sortedInsurers = Object.values(byInsurer)
      .sort((a, b) => b.premium - a.premium)
      .slice(0, limit)

    return {
      period: { startDate, endDate },
      topInsurers: sortedInsurers.map((insurer, index) => ({
        rank: index + 1,
        ...insurer,
      })),
    }
  }
}
