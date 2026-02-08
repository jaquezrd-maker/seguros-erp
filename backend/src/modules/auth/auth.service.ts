import prisma from '../../config/database'
import { supabaseAdmin } from '../../config/supabase'
import { UserRole } from '@prisma/client'

interface RegisterInput {
  email: string
  password: string
  name: string
  phone?: string
  role?: UserRole
}

interface LoginInput {
  email: string
  password: string
}

export class AuthService {
  async register(input: RegisterInput) {
    const { email, password, name, phone, role } = input

    // Check if a user with this email already exists in the database
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new Error('Ya existe un usuario con este correo electrónico')
    }

    // Create the user in Supabase Auth
    const { data: supabaseData, error: supabaseError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

    if (supabaseError) {
      throw new Error(`Error al crear usuario en Supabase: ${supabaseError.message}`)
    }

    // Create the matching record in the database
    const user = await prisma.user.create({
      data: {
        supabaseUserId: supabaseData.user.id,
        email,
        name,
        phone: phone || null,
        role: role || 'EJECUTIVO',
        status: 'ACTIVO',
      },
    })

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    }
  }

  async login(input: LoginInput) {
    const { email, password } = input

    // Authenticate via Supabase
    const { data: sessionData, error: authError } =
      await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      })

    if (authError) {
      throw new Error('Credenciales inválidas')
    }

    // Look up the user in the database
    const user = await prisma.user.findUnique({
      where: { supabaseUserId: sessionData.user.id },
    })

    if (!user) {
      throw new Error('Usuario no encontrado en el sistema')
    }

    if (user.status !== 'ACTIVO') {
      throw new Error('Usuario inactivo o bloqueado')
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    return {
      session: {
        accessToken: sessionData.session.access_token,
        refreshToken: sessionData.session.refresh_token,
        expiresAt: sessionData.session.expires_at,
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    }
  }

  async me(supabaseUserId: string) {
    const user = await prisma.user.findUnique({
      where: { supabaseUserId },
    })

    if (!user) {
      throw new Error('Usuario no encontrado')
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      status: user.status,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    }
  }

  async logout(accessToken: string) {
    const { error } = await supabaseAdmin.auth.admin.signOut(accessToken)

    if (error) {
      throw new Error(`Error al cerrar sesión: ${error.message}`)
    }
  }
}
