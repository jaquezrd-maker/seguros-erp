import prisma from '../../config/database'
import { setTenantContext, clearTenantContext } from '../../middleware/tenant-isolation.middleware'
import {
  CreateCompanyInput,
  UpdateCompanyInput,
  AddUserToCompanyInput,
  UpdateCompanyUserInput,
} from './companies.validation'
import { Prisma } from '@prisma/client'

/**
 * Companies Service
 * Handles business logic for company management (SUPER_ADMIN only)
 */
class CompaniesService {
  /**
   * Get all companies with pagination and search
   */
  async findAll(
    page = 1,
    limit = 10,
    search?: string,
    status?: string
  ): Promise<{ companies: any[]; total: number }> {
    // Bypass tenant isolation - SUPER_ADMIN can see all companies
    setTenantContext({ bypassTenantCheck: true })

    try {
      const where: Prisma.CompanyWhereInput = {}

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { legalName: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
          { rnc: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ]
      }

      if (status) {
        where.status = status as any
      }

      const [companies, total] = await Promise.all([
        prisma.company.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            _count: {
              select: {
                companyUsers: true,
                clients: true,
                policies: true,
                claims: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.company.count({ where }),
      ])

      return { companies, total }
    } finally {
      clearTenantContext()
    }
  }

  /**
   * Get a single company by ID
   */
  async findById(id: number) {
    setTenantContext({ bypassTenantCheck: true })

    try {
      const company = await prisma.company.findUnique({
        where: { id },
        include: {
          companyUsers: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  status: true,
                },
              },
            },
          },
          _count: {
            select: {
              clients: true,
              policies: true,
              claims: true,
              payments: true,
            },
          },
        },
      })

      if (!company) {
        throw new Error('Empresa no encontrada')
      }

      return company
    } finally {
      clearTenantContext()
    }
  }

  /**
   * Create a new company
   */
  async create(data: CreateCompanyInput) {
    setTenantContext({ bypassTenantCheck: true })

    try {
      // Check if slug already exists
      const existingCompany = await prisma.company.findUnique({
        where: { slug: data.slug },
      })

      if (existingCompany) {
        throw new Error('El slug ya está en uso')
      }

      // Check if RNC already exists (if provided)
      if (data.rnc) {
        const existingRnc = await prisma.company.findUnique({
          where: { rnc: data.rnc },
        })

        if (existingRnc) {
          throw new Error('El RNC ya está registrado')
        }
      }

      // Separate initialUser from company data
      const { initialUser, ...companyData } = data as any

      // Create company
      const company = await prisma.company.create({
        data: {
          ...companyData,
          trialEndsAt: companyData.trialEndsAt ? new Date(companyData.trialEndsAt) : undefined,
        },
      })

      // Create initial admin user if provided
      if (initialUser) {
        await this.createInitialUser(company.id, initialUser)
      }

      // Seed default insurance types for the new company
      await this.seedDefaultInsuranceTypes(company.id)

      return company
    } finally {
      clearTenantContext()
    }
  }

  /**
   * Create initial admin user for a new company
   */
  private async createInitialUser(companyId: number, userData: {
    name: string
    email: string
    password: string
    phone?: string
    role: string
  }) {
    const { supabaseAdmin } = await import('../../config/supabase')

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    })

    if (existingUser) {
      throw new Error(`El email ${userData.email} ya está registrado`)
    }

    // Create user in Supabase Auth
    const { data: supabaseData, error: supabaseError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
    })

    if (supabaseError || !supabaseData.user) {
      throw new Error(`Error al crear usuario en Supabase: ${supabaseError?.message || 'Unknown error'}`)
    }

    // Create user in database
    const user = await prisma.user.create({
      data: {
        supabaseUserId: supabaseData.user.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone || null,
        role: 'EJECUTIVO', // Regular role, not SUPER_ADMIN
        status: 'ACTIVO',
        activeCompanyId: companyId,
      },
    })

    // Link user to company
    await prisma.companyUser.create({
      data: {
        userId: user.id,
        companyId,
        role: userData.role as any,
        isActive: true,
      },
    })

    console.log(`[COMPANIES] Created initial user ${userData.email} for company ${companyId}`)
  }

  /**
   * Update a company
   */
  async update(id: number, data: UpdateCompanyInput) {
    setTenantContext({ bypassTenantCheck: true })

    try {
      // Check if company exists
      const company = await prisma.company.findUnique({ where: { id } })
      if (!company) {
        throw new Error('Empresa no encontrada')
      }

      // Check if slug is being changed and is unique
      if (data.slug && data.slug !== company.slug) {
        const existingSlug = await prisma.company.findUnique({
          where: { slug: data.slug },
        })

        if (existingSlug) {
          throw new Error('El slug ya está en uso')
        }
      }

      // Check if RNC is being changed and is unique
      if (data.rnc && data.rnc !== company.rnc) {
        const existingRnc = await prisma.company.findUnique({
          where: { rnc: data.rnc },
        })

        if (existingRnc) {
          throw new Error('El RNC ya está registrado')
        }
      }

      // Update company
      return await prisma.company.update({
        where: { id },
        data: {
          ...data,
          trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt) : undefined,
        },
      })
    } finally {
      clearTenantContext()
    }
  }

  /**
   * Delete a company (soft delete by setting status to CANCELADO)
   */
  async delete(id: number) {
    setTenantContext({ bypassTenantCheck: true })

    try {
      const company = await prisma.company.findUnique({ where: { id } })
      if (!company) {
        throw new Error('Empresa no encontrada')
      }

      return await prisma.company.update({
        where: { id },
        data: { status: 'CANCELADO' },
      })
    } finally {
      clearTenantContext()
    }
  }

  /**
   * Add a user to a company
   */
  async addUser(companyId: number, data: AddUserToCompanyInput) {
    setTenantContext({ bypassTenantCheck: true })

    try {
      // Check if company exists
      const company = await prisma.company.findUnique({ where: { id: companyId } })
      if (!company) {
        throw new Error('Empresa no encontrada')
      }

      // Check if user exists
      const user = await prisma.user.findUnique({ where: { id: data.userId } })
      if (!user) {
        throw new Error('Usuario no encontrado')
      }

      // Check if user is already in company
      const existingRelation = await prisma.companyUser.findUnique({
        where: {
          userId_companyId: {
            userId: data.userId,
            companyId,
          },
        },
      })

      if (existingRelation) {
        throw new Error('El usuario ya pertenece a esta empresa')
      }

      // Create relation
      return await prisma.companyUser.create({
        data: {
          userId: data.userId,
          companyId,
          role: data.role as any,
          isActive: data.isActive ?? true,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    } finally {
      clearTenantContext()
    }
  }

  /**
   * Update a user's role or status in a company
   */
  async updateUser(companyId: number, userId: number, data: UpdateCompanyUserInput) {
    setTenantContext({ bypassTenantCheck: true })

    try {
      const companyUser = await prisma.companyUser.findUnique({
        where: {
          userId_companyId: {
            userId,
            companyId,
          },
        },
      })

      if (!companyUser) {
        throw new Error('Usuario no encontrado en esta empresa')
      }

      return await prisma.companyUser.update({
        where: {
          userId_companyId: {
            userId,
            companyId,
          },
        },
        data: {
          role: data.role as any,
          isActive: data.isActive,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    } finally {
      clearTenantContext()
    }
  }

  /**
   * Remove a user from a company
   */
  async removeUser(companyId: number, userId: number) {
    setTenantContext({ bypassTenantCheck: true })

    try {
      const companyUser = await prisma.companyUser.findUnique({
        where: {
          userId_companyId: {
            userId,
            companyId,
          },
        },
      })

      if (!companyUser) {
        throw new Error('Usuario no encontrado en esta empresa')
      }

      await prisma.companyUser.delete({
        where: {
          userId_companyId: {
            userId,
            companyId,
          },
        },
      })

      return { success: true }
    } finally {
      clearTenantContext()
    }
  }

  /**
   * Seed default insurance types for a new company
   */
  private async seedDefaultInsuranceTypes(companyId: number) {
    const defaultTypes = [
      { name: 'Vehículos', category: 'Generales', description: 'Seguros de automóviles y vehículos' },
      { name: 'Salud', category: 'Personas', description: 'Seguros médicos y de salud' },
      { name: 'Vida', category: 'Personas', description: 'Seguros de vida' },
      { name: 'Hogar', category: 'Generales', description: 'Seguros de propiedad residencial' },
      { name: 'Empresarial', category: 'Generales', description: 'Seguros para empresas y negocios' },
    ]

    await prisma.insuranceType.createMany({
      data: defaultTypes.map((type) => ({
        companyId,
        ...type,
      })),
    })
  }
}

export default new CompaniesService()
