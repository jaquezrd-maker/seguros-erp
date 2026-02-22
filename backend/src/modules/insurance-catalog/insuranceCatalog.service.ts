import prisma from '../../config/database'
import { Prisma } from '@prisma/client'

class InsuranceCatalogService {
  async getCategories() {
    return prisma.insuranceCategory.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: 'asc' },
    })
  }

  async getCategoryBySlug(slug: string) {
    return prisma.insuranceCategory.findUnique({
      where: { slug },
      include: {
        products: {
          where: { isActive: true },
          include: {
            insurer: { select: { id: true, name: true, email: true, phone: true } },
            plans: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
            _count: { select: { plans: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })
  }

  async getProducts(params: {
    categoryId?: number
    insurerId?: number
    page: number
    limit: number
  }) {
    const { categoryId, insurerId, page, limit } = params
    const where: Prisma.InsuranceProductWhereInput = { isActive: true }

    if (categoryId) where.categoryId = categoryId
    if (insurerId) where.insurerId = insurerId

    const [data, total] = await Promise.all([
      prisma.insuranceProduct.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
          insurer: { select: { id: true, name: true } },
          plans: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
          _count: { select: { plans: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
      }),
      prisma.insuranceProduct.count({ where }),
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

  async getProductById(id: number) {
    return prisma.insuranceProduct.findUnique({
      where: { id },
      include: {
        category: true,
        insurer: { select: { id: true, name: true, rnc: true, email: true, phone: true, contactPerson: true } },
        plans: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      },
    })
  }

  async getProductPlans(productId: number) {
    return prisma.insurancePlan.findMany({
      where: { productId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
  }

  async getFeaturedProducts() {
    return prisma.insuranceProduct.findMany({
      where: { isActive: true, isFeatured: true },
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
        insurer: { select: { id: true, name: true } },
        plans: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, take: 3 },
      },
      orderBy: { sortOrder: 'asc' },
      take: 8,
    })
  }

  async searchProducts(query: string) {
    return prisma.insuranceProduct.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { shortDesc: { contains: query, mode: 'insensitive' } },
          { category: { name: { contains: query, mode: 'insensitive' } } },
          { insurer: { name: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
        insurer: { select: { id: true, name: true } },
        plans: { where: { isActive: true }, take: 1 },
      },
      take: 20,
    })
  }
}

export default new InsuranceCatalogService()
