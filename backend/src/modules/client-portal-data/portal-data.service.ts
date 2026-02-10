import prisma from '../../config/database'

interface DashboardStats {
  activePolicies: number
  pendingPayments: number
  pendingRenewals: number
  activeClaims: number
}

interface PolicyFilters {
  status?: string
  page?: number
  limit?: number
}

interface CreateClaimInput {
  policyId: number
  type: string
  dateOccurred: string
  description: string
  estimatedAmount?: number
}

export class PortalDataService {
  /**
   * Obtener estadísticas del dashboard para un cliente
   */
  async getDashboard(clientId: number): Promise<DashboardStats> {
    const [activePolicies, pendingPayments, pendingRenewals, activeClaims] = await Promise.all([
      prisma.policy.count({
        where: { clientId, status: 'VIGENTE' }
      }),
      prisma.payment.count({
        where: { clientId, status: 'PENDIENTE' }
      }),
      prisma.renewal.count({
        where: {
          policy: { clientId },
          status: 'PENDIENTE'
        }
      }),
      prisma.claim.count({
        where: {
          policy: { clientId },
          status: { in: ['PENDIENTE', 'EN_PROCESO', 'EN_REVISION', 'APROBADO'] }
        }
      })
    ])

    return {
      activePolicies,
      pendingPayments,
      pendingRenewals,
      activeClaims
    }
  }

  /**
   * Obtener pólizas del cliente
   */
  async getPolicies(clientId: number, filters: PolicyFilters = {}) {
    const where: any = { clientId }

    if (filters.status) {
      where.status = filters.status
    }

    const policies = await prisma.policy.findMany({
      where,
      include: {
        insurer: {
          select: { id: true, name: true }
        },
        insuranceType: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return policies
  }

  /**
   * Obtener detalle de una póliza específica
   */
  async getPolicyDetail(clientId: number, policyId: number) {
    const policy = await prisma.policy.findFirst({
      where: {
        id: policyId,
        clientId // CRÍTICO: validar propiedad
      },
      include: {
        insurer: {
          select: { id: true, name: true, phone: true, email: true }
        },
        insuranceType: {
          select: { id: true, name: true, category: true }
        },
        endorsements: {
          orderBy: { effectiveDate: 'desc' }
        }
      }
    })

    if (!policy) {
      throw new Error('Póliza no encontrada')
    }

    return policy
  }

  /**
   * Obtener pagos del cliente
   */
  async getPayments(clientId: number) {
    const payments = await prisma.payment.findMany({
      where: { clientId },
      include: {
        policy: {
          select: {
            id: true,
            policyNumber: true,
            insurer: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return payments
  }

  /**
   * Obtener renovaciones pendientes del cliente
   */
  async getRenewals(clientId: number) {
    const renewals = await prisma.renewal.findMany({
      where: {
        policy: { clientId },
        status: 'PENDIENTE'
      },
      include: {
        policy: {
          select: {
            id: true,
            policyNumber: true,
            insurer: { select: { name: true } },
            insuranceType: { select: { name: true } }
          }
        }
      },
      orderBy: { originalEndDate: 'asc' }
    })

    return renewals
  }

  /**
   * Obtener reclamos del cliente
   */
  async getClaims(clientId: number) {
    const claims = await prisma.claim.findMany({
      where: {
        policy: { clientId }
      },
      include: {
        policy: {
          select: {
            id: true,
            policyNumber: true,
            insurer: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return claims
  }

  /**
   * Crear un nuevo reclamo (única operación de escritura para clientes)
   */
  async createClaim(clientId: number, data: CreateClaimInput) {
    // Verificar que la póliza pertenece al cliente y está vigente
    const policy = await prisma.policy.findFirst({
      where: {
        id: data.policyId,
        clientId, // CRÍTICO: validar propiedad
        status: 'VIGENTE'
      }
    })

    if (!policy) {
      throw new Error('Póliza no encontrada o no está vigente')
    }

    // Generar número de reclamo
    const lastClaim = await prisma.claim.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true }
    })

    const claimNumber = `CLM-${String((lastClaim?.id || 0) + 1).padStart(6, '0')}`

    // Crear reclamo con prioridad MEDIA (clientes no pueden establecer ALTA o CRITICA)
    const claim = await prisma.claim.create({
      data: {
        claimNumber,
        policyId: data.policyId,
        type: data.type,
        dateOccurred: new Date(data.dateOccurred),
        dateReported: new Date(),
        description: data.description,
        estimatedAmount: data.estimatedAmount || null,
        status: 'EN_REVISION',
        priority: 'MEDIA'
      },
      include: {
        policy: {
          select: {
            policyNumber: true,
            insurer: { select: { name: true } }
          }
        }
      }
    })

    return claim
  }

  /**
   * Obtener información del perfil del cliente
   */
  async getProfile(clientId: number) {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        phoneAlt: true,
        address: true,
        city: true,
        province: true,
        type: true,
        cedulaRnc: true
      }
    })

    if (!client) {
      throw new Error('Cliente no encontrado')
    }

    return client
  }
}

export const portalDataService = new PortalDataService()
