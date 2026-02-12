import { PrismaClient, UserRole, Module } from '@prisma/client'

const prisma = new PrismaClient()

interface PermissionConfig {
  role: UserRole
  module: Module
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

const defaultPermissions: PermissionConfig[] = [
  // ============= SUPER_ADMIN - Full Access =============
  { role: 'SUPER_ADMIN', module: 'DASHBOARD', canView: true, canCreate: true, canEdit: true, canDelete: true },
  { role: 'SUPER_ADMIN', module: 'CLIENTS', canView: true, canCreate: true, canEdit: true, canDelete: true },
  { role: 'SUPER_ADMIN', module: 'POLICIES', canView: true, canCreate: true, canEdit: true, canDelete: true },
  { role: 'SUPER_ADMIN', module: 'INSURERS', canView: true, canCreate: true, canEdit: true, canDelete: true },
  { role: 'SUPER_ADMIN', module: 'CLAIMS', canView: true, canCreate: true, canEdit: true, canDelete: true },
  { role: 'SUPER_ADMIN', module: 'PAYMENTS', canView: true, canCreate: true, canEdit: true, canDelete: true },
  { role: 'SUPER_ADMIN', module: 'RENEWALS', canView: true, canCreate: true, canEdit: true, canDelete: true },
  { role: 'SUPER_ADMIN', module: 'COMMISSIONS', canView: true, canCreate: true, canEdit: true, canDelete: true },
  { role: 'SUPER_ADMIN', module: 'REPORTS', canView: true, canCreate: true, canEdit: true, canDelete: true },
  { role: 'SUPER_ADMIN', module: 'USERS', canView: true, canCreate: true, canEdit: true, canDelete: true },
  { role: 'SUPER_ADMIN', module: 'COMPANIES', canView: true, canCreate: true, canEdit: true, canDelete: true },
  { role: 'SUPER_ADMIN', module: 'SETTINGS', canView: true, canCreate: true, canEdit: true, canDelete: true },
  { role: 'SUPER_ADMIN', module: 'CALENDAR', canView: true, canCreate: true, canEdit: true, canDelete: true },
  { role: 'SUPER_ADMIN', module: 'TASKS', canView: true, canCreate: true, canEdit: true, canDelete: true },

  // ============= ADMINISTRADOR - All except Companies =============
  { role: 'ADMINISTRADOR', module: 'DASHBOARD', canView: true, canCreate: true, canEdit: true, canDelete: true },
  { role: 'ADMINISTRADOR', module: 'CLIENTS', canView: true, canCreate: true, canEdit: true, canDelete: true },
  { role: 'ADMINISTRADOR', module: 'POLICIES', canView: true, canCreate: true, canEdit: true, canDelete: true },
  { role: 'ADMINISTRADOR', module: 'INSURERS', canView: true, canCreate: true, canEdit: true, canDelete: true },
  { role: 'ADMINISTRADOR', module: 'CLAIMS', canView: true, canCreate: true, canEdit: true, canDelete: true },
  { role: 'ADMINISTRADOR', module: 'PAYMENTS', canView: true, canCreate: true, canEdit: true, canDelete: true },
  { role: 'ADMINISTRADOR', module: 'RENEWALS', canView: true, canCreate: true, canEdit: true, canDelete: true },
  { role: 'ADMINISTRADOR', module: 'COMMISSIONS', canView: true, canCreate: true, canEdit: true, canDelete: true },
  { role: 'ADMINISTRADOR', module: 'REPORTS', canView: true, canCreate: true, canEdit: true, canDelete: true },
  { role: 'ADMINISTRADOR', module: 'USERS', canView: true, canCreate: true, canEdit: true, canDelete: true },
  { role: 'ADMINISTRADOR', module: 'COMPANIES', canView: false, canCreate: false, canEdit: false, canDelete: false },
  { role: 'ADMINISTRADOR', module: 'SETTINGS', canView: true, canCreate: true, canEdit: true, canDelete: false },
  { role: 'ADMINISTRADOR', module: 'CALENDAR', canView: true, canCreate: true, canEdit: true, canDelete: true },
  { role: 'ADMINISTRADOR', module: 'TASKS', canView: true, canCreate: true, canEdit: true, canDelete: true },

  // ============= EJECUTIVO - Operational modules =============
  { role: 'EJECUTIVO', module: 'DASHBOARD', canView: true, canCreate: false, canEdit: false, canDelete: false },
  { role: 'EJECUTIVO', module: 'CLIENTS', canView: true, canCreate: true, canEdit: true, canDelete: false },
  { role: 'EJECUTIVO', module: 'POLICIES', canView: true, canCreate: true, canEdit: true, canDelete: false },
  { role: 'EJECUTIVO', module: 'INSURERS', canView: true, canCreate: false, canEdit: false, canDelete: false },
  { role: 'EJECUTIVO', module: 'CLAIMS', canView: true, canCreate: true, canEdit: true, canDelete: false },
  { role: 'EJECUTIVO', module: 'PAYMENTS', canView: true, canCreate: true, canEdit: true, canDelete: false },
  { role: 'EJECUTIVO', module: 'RENEWALS', canView: true, canCreate: true, canEdit: true, canDelete: false },
  { role: 'EJECUTIVO', module: 'COMMISSIONS', canView: true, canCreate: false, canEdit: false, canDelete: false },
  { role: 'EJECUTIVO', module: 'REPORTS', canView: true, canCreate: false, canEdit: false, canDelete: false },
  { role: 'EJECUTIVO', module: 'USERS', canView: false, canCreate: false, canEdit: false, canDelete: false },
  { role: 'EJECUTIVO', module: 'COMPANIES', canView: false, canCreate: false, canEdit: false, canDelete: false },
  { role: 'EJECUTIVO', module: 'SETTINGS', canView: false, canCreate: false, canEdit: false, canDelete: false },
  { role: 'EJECUTIVO', module: 'CALENDAR', canView: true, canCreate: true, canEdit: true, canDelete: true },
  { role: 'EJECUTIVO', module: 'TASKS', canView: true, canCreate: true, canEdit: true, canDelete: true },

  // ============= CONTABILIDAD - Financial modules =============
  { role: 'CONTABILIDAD', module: 'DASHBOARD', canView: true, canCreate: false, canEdit: false, canDelete: false },
  { role: 'CONTABILIDAD', module: 'CLIENTS', canView: true, canCreate: false, canEdit: false, canDelete: false },
  { role: 'CONTABILIDAD', module: 'POLICIES', canView: true, canCreate: false, canEdit: false, canDelete: false },
  { role: 'CONTABILIDAD', module: 'INSURERS', canView: true, canCreate: false, canEdit: false, canDelete: false },
  { role: 'CONTABILIDAD', module: 'CLAIMS', canView: true, canCreate: false, canEdit: false, canDelete: false },
  { role: 'CONTABILIDAD', module: 'PAYMENTS', canView: true, canCreate: true, canEdit: true, canDelete: false },
  { role: 'CONTABILIDAD', module: 'RENEWALS', canView: true, canCreate: false, canEdit: false, canDelete: false },
  { role: 'CONTABILIDAD', module: 'COMMISSIONS', canView: true, canCreate: true, canEdit: true, canDelete: false },
  { role: 'CONTABILIDAD', module: 'REPORTS', canView: true, canCreate: true, canEdit: false, canDelete: false },
  { role: 'CONTABILIDAD', module: 'USERS', canView: false, canCreate: false, canEdit: false, canDelete: false },
  { role: 'CONTABILIDAD', module: 'COMPANIES', canView: false, canCreate: false, canEdit: false, canDelete: false },
  { role: 'CONTABILIDAD', module: 'SETTINGS', canView: false, canCreate: false, canEdit: false, canDelete: false },
  { role: 'CONTABILIDAD', module: 'CALENDAR', canView: true, canCreate: true, canEdit: true, canDelete: true },
  { role: 'CONTABILIDAD', module: 'TASKS', canView: true, canCreate: true, canEdit: true, canDelete: true },

  // ============= SOLO_LECTURA - View only =============
  { role: 'SOLO_LECTURA', module: 'DASHBOARD', canView: true, canCreate: false, canEdit: false, canDelete: false },
  { role: 'SOLO_LECTURA', module: 'CLIENTS', canView: true, canCreate: false, canEdit: false, canDelete: false },
  { role: 'SOLO_LECTURA', module: 'POLICIES', canView: true, canCreate: false, canEdit: false, canDelete: false },
  { role: 'SOLO_LECTURA', module: 'INSURERS', canView: true, canCreate: false, canEdit: false, canDelete: false },
  { role: 'SOLO_LECTURA', module: 'CLAIMS', canView: true, canCreate: false, canEdit: false, canDelete: false },
  { role: 'SOLO_LECTURA', module: 'PAYMENTS', canView: true, canCreate: false, canEdit: false, canDelete: false },
  { role: 'SOLO_LECTURA', module: 'RENEWALS', canView: true, canCreate: false, canEdit: false, canDelete: false },
  { role: 'SOLO_LECTURA', module: 'COMMISSIONS', canView: true, canCreate: false, canEdit: false, canDelete: false },
  { role: 'SOLO_LECTURA', module: 'REPORTS', canView: true, canCreate: false, canEdit: false, canDelete: false },
  { role: 'SOLO_LECTURA', module: 'USERS', canView: false, canCreate: false, canEdit: false, canDelete: false },
  { role: 'SOLO_LECTURA', module: 'COMPANIES', canView: false, canCreate: false, canEdit: false, canDelete: false },
  { role: 'SOLO_LECTURA', module: 'SETTINGS', canView: false, canCreate: false, canEdit: false, canDelete: false },
  { role: 'SOLO_LECTURA', module: 'CALENDAR', canView: true, canCreate: false, canEdit: false, canDelete: false },
  { role: 'SOLO_LECTURA', module: 'TASKS', canView: true, canCreate: false, canEdit: false, canDelete: false },

  // ============= CLIENTE - Client portal only =============
  { role: 'CLIENTE', module: 'DASHBOARD', canView: true, canCreate: false, canEdit: false, canDelete: false },
  { role: 'CLIENTE', module: 'CLIENTS', canView: false, canCreate: false, canEdit: false, canDelete: false },
  { role: 'CLIENTE', module: 'POLICIES', canView: true, canCreate: false, canEdit: false, canDelete: false },
  { role: 'CLIENTE', module: 'INSURERS', canView: false, canCreate: false, canEdit: false, canDelete: false },
  { role: 'CLIENTE', module: 'CLAIMS', canView: true, canCreate: true, canEdit: false, canDelete: false },
  { role: 'CLIENTE', module: 'PAYMENTS', canView: true, canCreate: false, canEdit: false, canDelete: false },
  { role: 'CLIENTE', module: 'RENEWALS', canView: true, canCreate: false, canEdit: false, canDelete: false },
  { role: 'CLIENTE', module: 'COMMISSIONS', canView: false, canCreate: false, canEdit: false, canDelete: false },
  { role: 'CLIENTE', module: 'REPORTS', canView: false, canCreate: false, canEdit: false, canDelete: false },
  { role: 'CLIENTE', module: 'USERS', canView: false, canCreate: false, canEdit: false, canDelete: false },
  { role: 'CLIENTE', module: 'COMPANIES', canView: false, canCreate: false, canEdit: false, canDelete: false },
  { role: 'CLIENTE', module: 'SETTINGS', canView: true, canCreate: false, canEdit: true, canDelete: false },
  { role: 'CLIENTE', module: 'CALENDAR', canView: false, canCreate: false, canEdit: false, canDelete: false },
  { role: 'CLIENTE', module: 'TASKS', canView: false, canCreate: false, canEdit: false, canDelete: false },
]

async function seedPermissions() {
  console.log('[PERMISSIONS SEED] Starting permissions seed...')

  for (const permission of defaultPermissions) {
    await prisma.modulePermission.upsert({
      where: {
        role_module: {
          role: permission.role,
          module: permission.module,
        },
      },
      update: {
        canView: permission.canView,
        canCreate: permission.canCreate,
        canEdit: permission.canEdit,
        canDelete: permission.canDelete,
      },
      create: permission,
    })
  }

  console.log(`[PERMISSIONS SEED] ✅ Seeded ${defaultPermissions.length} permissions`)
}

seedPermissions()
  .catch((e) => {
    console.error('[PERMISSIONS SEED] ❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
