import prisma from '../../config/database'
import { UserRole, UserStatus } from '@prisma/client'
import { supabaseAdmin } from '../../config/supabase'

interface UserFilters {
  search?: string
  page?: number
  limit?: number
}

interface CreateUserInput {
  name: string
  email: string
  role: UserRole
  phone?: string | null
  password: string
}

interface UpdateUserInput {
  name?: string
  email?: string
  role?: UserRole
  phone?: string | null
}

export class UsersService {
  async findAll(filters: UserFilters) {
    const { search, page = 1, limit = 20 } = filters
    const skip = (page - 1) * limit

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          status: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
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
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            createdClients: true,
            createdPolicies: true,
            commissions: true,
          },
        },
      },
    })

    if (!user) {
      throw new Error('Usuario no encontrado')
    }

    return user
  }

  async create(input: CreateUserInput) {
    // Check for existing email in database
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    })

    if (existing) {
      throw new Error('Ya existe un usuario con este correo electrónico')
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
    })

    if (authError) {
      throw new Error(`Error al crear usuario en Supabase: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('No se pudo crear el usuario en Supabase')
    }

    // Create user in database linked to Supabase user
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        role: input.role,
        phone: input.phone || null,
        status: 'ACTIVO',
        supabaseUserId: authData.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    })

    return user
  }

  async update(id: number, input: UpdateUserInput) {
    const existing = await prisma.user.findUnique({ where: { id } })

    if (!existing) {
      throw new Error('Usuario no encontrado')
    }

    // If email is being changed, check for uniqueness
    if (input.email && input.email !== existing.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: input.email },
      })
      if (emailExists) {
        throw new Error('Ya existe un usuario con este correo electrónico')
      }
    }

    const data: any = {}
    if (input.name !== undefined) data.name = input.name
    if (input.email !== undefined) data.email = input.email
    if (input.role !== undefined) data.role = input.role
    if (input.phone !== undefined) data.phone = input.phone

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return user
  }

  async updateStatus(id: number, status: UserStatus) {
    const existing = await prisma.user.findUnique({ where: { id } })

    if (!existing) {
      throw new Error('Usuario no encontrado')
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    })

    return user
  }

  async delete(id: number, permanent: boolean = false) {
    const existing = await prisma.user.findUnique({
      where: { id },
      include: {
        createdClients: true,
        createdPolicies: true,
        createdPayments: true,
        assignedClaims: true,
        commissions: true,
      }
    })

    if (!existing) {
      throw new Error('Usuario no encontrado')
    }

    // Hard delete: eliminación permanente
    if (permanent) {
      // Verificar si tiene datos relacionados
      const hasRelatedData = 
        existing.createdClients.length > 0 ||
        existing.createdPolicies.length > 0 ||
        existing.createdPayments.length > 0 ||
        existing.assignedClaims.length > 0 ||
        existing.commissions.length > 0

      if (hasRelatedData) {
        throw new Error(
          'No se puede eliminar permanentemente este usuario porque tiene datos relacionados (clientes, pólizas, pagos, reclamos o comisiones). Use la desactivación en su lugar.'
        )
      }

      return prisma.user.delete({
        where: { id },
      })
    }

    // Soft delete: set status to INACTIVO
    return prisma.user.update({
      where: { id },
      data: { status: 'INACTIVO' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    })
  }
}
