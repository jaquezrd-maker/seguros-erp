import crypto from 'crypto'
import prisma from '../../config/database'
import { supabaseAdmin } from '../../config/supabase'

interface CreateInvitationResult {
  id: number
  email: string
  token: string
  expiresAt: Date
}

interface ValidationResult {
  clientId: number
  clientName: string
  email: string
}

export class ClientPortalService {
  /**
   * Generar token y crear invitación para acceso al portal
   */
  async createInvitation(clientId: number, createdBy: number): Promise<CreateInvitationResult> {
    // Verificar que el cliente existe
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, email: true, userId: true, name: true }
    })

    if (!client) {
      throw new Error('Cliente no encontrado')
    }

    if (!client.email) {
      throw new Error('El cliente no tiene un email registrado')
    }

    // Verificar que cliente no tiene portal ya
    if (client.userId) {
      throw new Error('Este cliente ya tiene acceso al portal')
    }

    // Verificar si el email ya está registrado como usuario interno
    const existingUser = await prisma.user.findUnique({
      where: { email: client.email },
      select: { id: true, role: true, email: true }
    })

    if (existingUser && existingUser.role !== 'CLIENTE') {
      throw new Error(`Este correo (${client.email}) ya está registrado como usuario interno (${existingUser.role}). El cliente debe usar un correo diferente para el portal.`)
    }

    // Verificar si hay una invitación pendiente
    const existingInvitation = await prisma.clientInvitation.findFirst({
      where: {
        clientId,
        accepted: false,
        expiresAt: { gt: new Date() }
      },
      select: {
        id: true,
        email: true,
        token: true,
        expiresAt: true
      }
    })

    // Si hay una invitación pendiente, devolverla
    if (existingInvitation) {
      return existingInvitation
    }

    // Generar token único (64 caracteres hex = 32 bytes)
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 horas

    // Crear invitación
    const invitation = await prisma.clientInvitation.create({
      data: {
        clientId,
        email: client.email,
        token,
        expiresAt,
        createdBy
      },
      select: {
        id: true,
        email: true,
        token: true,
        expiresAt: true
      }
    })

    // TODO: Enviar email con el token de invitación
    // const registrationUrl = `${process.env.FRONTEND_URL}/client/register/${token}`
    // await sendEmail({ ... })

    return invitation
  }

  /**
   * Validar token de invitación
   */
  async validateInvitation(token: string): Promise<ValidationResult> {
    const invitation = await prisma.clientInvitation.findUnique({
      where: { token },
      include: {
        client: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!invitation) {
      throw new Error('Token de invitación inválido')
    }

    if (invitation.accepted) {
      throw new Error('Esta invitación ya ha sido aceptada')
    }

    if (invitation.expiresAt < new Date()) {
      throw new Error('Token de invitación expirado')
    }

    return {
      clientId: invitation.client.id,
      clientName: invitation.client.name,
      email: invitation.email
    }
  }

  /**
   * Completar registro de cliente
   */
  async completeRegistration(token: string, password: string): Promise<{ success: boolean; message: string }> {
    // Validar invitación
    const invitation = await this.validateInvitation(token)

    // Verificar si el cliente ya tiene una cuenta de usuario vinculada
    const existingClient = await prisma.client.findUnique({
      where: { id: invitation.clientId },
      select: { userId: true, email: true }
    })

    if (existingClient?.userId) {
      throw new Error('Este cliente ya tiene una cuenta de portal activa. Por favor inicie sesión.')
    }

    // Crear usuario en Supabase Auth
    const { data: authUser, error } = await supabaseAdmin.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true,
      user_metadata: {
        name: invitation.clientName,
        role: 'CLIENTE'
      }
    })

    if (error || !authUser.user) {
      console.error('Error creating Supabase user:', error)

      // Detectar error de email duplicado
      if (error?.message?.includes('already been registered') || (error as any)?.code === 'email_exists') {
        throw new Error('Este correo electrónico ya está registrado en el sistema. Si es un usuario interno, no puede usar el portal de clientes. Contacte al administrador.')
      }

      throw new Error('Error creando usuario de autenticación: ' + (error?.message || 'Error desconocido'))
    }

    // Crear usuario en BD con rol CLIENTE
    const user = await prisma.user.create({
      data: {
        supabaseUserId: authUser.user.id,
        name: invitation.clientName,
        email: invitation.email,
        role: 'CLIENTE',
        status: 'ACTIVO',
        forcePasswordChange: true
      }
    })

    // Vincular usuario a cliente
    await prisma.client.update({
      where: { id: invitation.clientId },
      data: { userId: user.id }
    })

    // Marcar invitación como aceptada
    await prisma.clientInvitation.update({
      where: { token },
      data: { accepted: true }
    })

    return {
      success: true,
      message: 'Registro completado exitosamente'
    }
  }

  /**
   * Cambiar contraseña de cliente
   */
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, supabaseUserId: true }
    })

    if (!user || !user.supabaseUserId) {
      throw new Error('Usuario no encontrado')
    }

    // Verificar contraseña actual intentando iniciar sesión
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    })

    if (signInError) {
      throw new Error('Contraseña actual incorrecta')
    }

    // Actualizar contraseña en Supabase
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.supabaseUserId,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      throw new Error('Error actualizando contraseña')
    }

    // Desactivar flag de forzar cambio de contraseña
    await prisma.user.update({
      where: { id: userId },
      data: { forcePasswordChange: false }
    })
  }
}

export const clientPortalService = new ClientPortalService()
