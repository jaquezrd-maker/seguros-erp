import prisma from '../../config/database'
import { Prisma } from '@prisma/client'

class QuotationsService {
  private async generateQuotationNo(companyId: number): Promise<string> {
    const count = await prisma.quotation.count({ where: { companyId } })
    const num = (count + 1).toString().padStart(6, '0')
    return `COT-${num}`
  }

  private async generateProposalNo(companyId: number): Promise<string> {
    const count = await prisma.proposal.count({ where: { companyId } })
    const num = (count + 1).toString().padStart(6, '0')
    return `PROP-${num}`
  }

  async findAll(companyId: number | undefined, params: { page: number; limit: number; status?: string; search?: string }) {
    const { page, limit, status, search } = params
    const where: Prisma.QuotationWhereInput = {}

    if (companyId) where.companyId = companyId
    if (status) where.status = status as any
    if (search) {
      where.OR = [
        { quotationNo: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { clientEmail: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        include: {
          client: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true } },
              plan: { select: { id: true, name: true, tier: true } },
            },
          },
          _count: { select: { items: true, proposals: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.quotation.count({ where }),
    ])

    return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } }
  }

  async findById(id: number, companyId: number | undefined) {
    const where: Prisma.QuotationWhereUniqueInput = { id }
    return prisma.quotation.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
      include: {
        client: true,
        creator: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { include: { category: true, insurer: { select: { id: true, name: true } } } },
            plan: true,
          },
        },
        proposals: { orderBy: { createdAt: 'desc' } },
      },
    })
  }

  async create(companyId: number, userId: number, data: any) {
    const quotationNo = await this.generateQuotationNo(companyId)

    // Calculate total premium from items
    const totalPremium = data.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.premium) || 0), 0) || 0

    return prisma.quotation.create({
      data: {
        companyId,
        quotationNo,
        clientId: data.clientId || null,
        clientName: data.clientName,
        clientEmail: data.clientEmail || null,
        clientPhone: data.clientPhone || null,
        status: 'BORRADOR',
        totalPremium,
        currency: data.currency || 'DOP',
        notes: data.notes || null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        createdBy: userId,
        items: {
          create: (data.items || []).map((item: any) => ({
            productId: item.productId,
            planId: item.planId,
            premium: item.premium,
            coverage: item.coverage || null,
            deductible: item.deductible || null,
            details: item.details || null,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true } },
            plan: { select: { id: true, name: true, tier: true } },
          },
        },
      },
    })
  }

  async update(id: number, companyId: number | undefined, data: any) {
    // Delete existing items and recreate
    await prisma.quotationItem.deleteMany({ where: { quotationId: id } })

    const totalPremium = data.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.premium) || 0), 0) || 0

    return prisma.quotation.update({
      where: { id },
      data: {
        clientId: data.clientId || null,
        clientName: data.clientName,
        clientEmail: data.clientEmail || null,
        clientPhone: data.clientPhone || null,
        totalPremium,
        currency: data.currency || 'DOP',
        notes: data.notes || null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        items: {
          create: (data.items || []).map((item: any) => ({
            productId: item.productId,
            planId: item.planId,
            premium: item.premium,
            coverage: item.coverage || null,
            deductible: item.deductible || null,
            details: item.details || null,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true } },
            plan: { select: { id: true, name: true, tier: true } },
          },
        },
      },
    })
  }

  async updateStatus(id: number, companyId: number | undefined, status: string) {
    return prisma.quotation.update({
      where: { id },
      data: { status: status as any },
    })
  }

  async delete(id: number, companyId: number | undefined) {
    await prisma.quotationItem.deleteMany({ where: { quotationId: id } })
    return prisma.quotation.delete({ where: { id } })
  }

  // Proposals
  async findAllProposals(companyId: number | undefined, params: { page: number; limit: number; status?: string }) {
    const { page, limit, status } = params
    const where: Prisma.ProposalWhereInput = {}

    if (companyId) where.companyId = companyId
    if (status) where.status = status as any

    const [data, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        include: {
          client: { select: { id: true, name: true } },
          quotation: { select: { id: true, quotationNo: true } },
          creator: { select: { id: true, name: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.proposal.count({ where }),
    ])

    return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } }
  }

  async findProposalById(id: number, companyId: number | undefined) {
    return prisma.proposal.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
      include: {
        client: true,
        quotation: {
          include: {
            items: {
              include: {
                product: { include: { category: true, insurer: { select: { id: true, name: true } } } },
                plan: true,
              },
            },
          },
        },
        creator: { select: { id: true, name: true, email: true } },
      },
    })
  }

  async createProposal(companyId: number, userId: number, data: any) {
    const proposalNo = await this.generateProposalNo(companyId)

    return prisma.proposal.create({
      data: {
        companyId,
        proposalNo,
        quotationId: data.quotationId || null,
        clientId: data.clientId || null,
        clientName: data.clientName,
        clientEmail: data.clientEmail || null,
        status: 'BORRADOR',
        totalPremium: data.totalPremium,
        currency: data.currency || 'DOP',
        coverageSummary: data.coverageSummary || null,
        terms: data.terms || null,
        notes: data.notes || null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        createdBy: userId,
      },
    })
  }

  async updateProposalStatus(id: number, companyId: number | undefined, status: string) {
    return prisma.proposal.update({
      where: { id },
      data: { status: status as any },
    })
  }

  async generateProposalFromQuotation(quotationId: number, companyId: number, userId: number) {
    const quotation = await this.findById(quotationId, companyId)
    if (!quotation) throw new Error('Cotización no encontrada')

    const proposalNo = await this.generateProposalNo(companyId)

    // Build coverage summary from quotation items
    const coverageSummary = quotation.items.map((item: any) => ({
      product: item.product.name,
      category: item.product.category?.name,
      insurer: item.product.insurer?.name,
      plan: item.plan.name,
      tier: item.plan.tier,
      premium: item.premium,
      coverage: item.coverage,
      deductible: item.deductible,
      coverages: item.plan.coverages,
    }))

    // Update quotation status
    await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: 'ACEPTADA' },
    })

    return prisma.proposal.create({
      data: {
        companyId,
        proposalNo,
        quotationId,
        clientId: quotation.clientId,
        clientName: quotation.clientName,
        clientEmail: quotation.clientEmail,
        status: 'BORRADOR',
        totalPremium: quotation.totalPremium,
        currency: quotation.currency,
        coverageSummary,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdBy: userId,
      },
      include: {
        quotation: true,
        client: true,
      },
    })
  }
}

export default new QuotationsService()
