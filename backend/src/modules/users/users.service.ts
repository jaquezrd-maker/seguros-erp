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

      // Eliminar usuario de Supabase Auth primero (si tiene supabaseUserId)
      if (existing.supabaseUserId) {
        try {
          const { error } = await supabaseAdmin.auth.admin.deleteUser(existing.supabaseUserId)
          if (error) {
            console.error('Error deleting user from Supabase Auth:', error)
            // Continuar con la eliminación de la BD aunque falle en Supabase
            // El usuario de Supabase quedará huérfano pero no bloqueará la operación
          } else {
            console.log(`Usuario eliminado de Supabase Auth: ${existing.email}`)
          }
        } catch (error) {
          console.error('Unexpected error deleting from Supabase Auth:', error)
          // Continuar con la eliminación de la BD
        }
      }

      // Eliminar de la base de datos
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

  /**
   * Limpiar usuarios huérfanos en Supabase Auth (que existen en Supabase pero no en la BD)
   * UTILIDAD: Solo para limpiar datos inconsistentes
   */
  async cleanOrphanedSupabaseUsers() {
    try {
      // Obtener todos los usuarios de la base de datos
      const dbUsers = await prisma.user.findMany({
        select: { supabaseUserId: true, email: true }
      })

      const dbSupabaseIds = new Set(dbUsers.map(u => u.supabaseUserId).filter(Boolean))

      // Obtener usuarios de Supabase Auth (con paginación)
      const { data: { users: supabaseUsers }, error } = await supabaseAdmin.auth.admin.listUsers()

      if (error) {
        throw new Error(`Error listando usuarios de Supabase: ${error.message}`)
      }

      // Encontrar usuarios huérfanos (en Supabase pero no en BD)
      const orphanedUsers = supabaseUsers?.filter(su => !dbSupabaseIds.has(su.id)) || []

      // Eliminar usuarios huérfanos
      const deletedUsers = []
      for (const orphan of orphanedUsers) {
        try {
          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(orphan.id)
          if (deleteError) {
            console.error(`Error eliminando usuario huérfano ${orphan.email}:`, deleteError)
          } else {
            deletedUsers.push({ id: orphan.id, email: orphan.email })
            console.log(`Usuario huérfano eliminado de Supabase: ${orphan.email}`)
          }
        } catch (err) {
          console.error(`Error inesperado eliminando ${orphan.email}:`, err)
        }
      }

      return {
        totalSupabaseUsers: supabaseUsers?.length || 0,
        totalDbUsers: dbUsers.length,
        orphanedFound: orphanedUsers.length,
        orphanedDeleted: deletedUsers.length,
        deletedUsers
      }
    } catch (error: any) {
      throw new Error(`Error limpiando usuarios huérfanos: ${error.message}`)
    }
  }
}
