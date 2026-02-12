import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DEFAULT_PASSWORD = 'Admin123!'

async function getOrCreateSupabaseUser(email: string, password: string): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) {
    if (error.message.includes('already been registered')) {
      const { data: listData } = await supabase.auth.admin.listUsers()
      const existing = listData.users.find(u => u.email === email)
      if (existing) return existing.id
    }
    throw error
  }
  return data.user.id
}

async function main() {
  console.log('Seeding database...')

  // Create default company
  const defaultCompany = await prisma.company.upsert({
    where: { slug: 'corredora-principal' },
    update: {},
    create: {
      name: 'Corredora Principal',
      slug: 'corredora-principal',
      legalName: 'Corredora de Seguros Principal SRL',
      rnc: '131000000',
      email: 'info@corredora.com.do',
      phone: '809-555-1000',
      status: 'ACTIVO',
    },
  })

  console.log(`Created default company: ${defaultCompany.name}`)

  const companyId = defaultCompany.id

  // Insurance Types
  const insuranceTypes = await Promise.all([
    prisma.insuranceType.upsert({
      where: { companyId_name: { companyId, name: 'Vehículos' } },
      update: {},
      create: { companyId, name: 'Vehículos', category: 'Generales', description: 'Seguro de vehículos de motor' }
    }),
    prisma.insuranceType.upsert({
      where: { companyId_name: { companyId, name: 'Salud' } },
      update: {},
      create: { companyId, name: 'Salud', category: 'Personas', description: 'Seguro de salud y gastos médicos' }
    }),
    prisma.insuranceType.upsert({
      where: { companyId_name: { companyId, name: 'Vida' } },
      update: {},
      create: { companyId, name: 'Vida', category: 'Personas', description: 'Seguro de vida individual y colectivo' }
    }),
    prisma.insuranceType.upsert({
      where: { companyId_name: { companyId, name: 'Propiedad' } },
      update: {},
      create: { companyId, name: 'Propiedad', category: 'Generales', description: 'Seguro de propiedad e inmuebles' }
    }),
    prisma.insuranceType.upsert({
      where: { companyId_name: { companyId, name: 'Incendio' } },
      update: {},
      create: { companyId, name: 'Incendio', category: 'Generales', description: 'Seguro contra incendio y líneas aliadas' }
    }),
    prisma.insuranceType.upsert({
      where: { companyId_name: { companyId, name: 'Responsabilidad Civil' } },
      update: {},
      create: { companyId, name: 'Responsabilidad Civil', category: 'Generales', description: 'Seguro de responsabilidad civil general' }
    }),
    prisma.insuranceType.upsert({
      where: { companyId_name: { companyId, name: 'PYME' } },
      update: {},
      create: { companyId, name: 'PYME', category: 'Comercial', description: 'Paquete de seguros para pequeñas y medianas empresas' }
    }),
    prisma.insuranceType.upsert({
      where: { companyId_name: { companyId, name: 'Hogar' } },
      update: {},
      create: { companyId, name: 'Hogar', category: 'Generales', description: 'Seguro integral del hogar' }
    }),
    prisma.insuranceType.upsert({
      where: { companyId_name: { companyId, name: 'Fianzas' } },
      update: {},
      create: { companyId, name: 'Fianzas', category: 'Comercial', description: 'Fianzas y garantías' }
    }),
  ])

  console.log(`Created ${insuranceTypes.length} insurance types`)

  // Create users in Supabase Auth and link to DB
  const seedUsers = [
    { name: 'Emmanuel Admin', email: 'admin@corredora.com.do', role: 'ADMINISTRADOR' as const },
    { name: 'Luis Fernández', email: 'luis@corredora.com.do', role: 'EJECUTIVO' as const },
    { name: 'Carmen Díaz', email: 'carmen@corredora.com.do', role: 'EJECUTIVO' as const },
    { name: 'Roberto Matos', email: 'roberto@corredora.com.do', role: 'CONTABILIDAD' as const },
  ]

  const dbUsers = []
  for (const u of seedUsers) {
    const supabaseId = await getOrCreateSupabaseUser(u.email, DEFAULT_PASSWORD)
    const dbUser = await prisma.user.upsert({
      where: { email: u.email },
      update: { supabaseUserId: supabaseId },
      create: {
        name: u.name,
        email: u.email,
        role: u.role,
        status: 'ACTIVO',
        supabaseUserId: supabaseId,
        activeCompanyId: companyId,
      },
    })

    // Create CompanyUser relation
    await prisma.companyUser.upsert({
      where: { userId_companyId: { userId: dbUser.id, companyId } },
      update: {},
      create: {
        userId: dbUser.id,
        companyId,
        role: u.role,
        isActive: true,
      },
    })

    dbUsers.push(dbUser)
  }

  const [adminUser, ejecutivo1, ejecutivo2, contabilidad] = dbUsers

  console.log('Created users with Supabase Auth and CompanyUser relations')
  console.log(`  Login credentials for all users: password = ${DEFAULT_PASSWORD}`)

  // Insurers
  const universal = await prisma.insurer.upsert({
    where: { companyId_rnc: { companyId, rnc: '101012345' } },
    update: {},
    create: { companyId, name: 'Seguros Universal', rnc: '101012345', legalName: 'Universal de Seguros SA', phone: '809-544-7111', email: 'comercial@universal.com.do', status: 'ACTIVA' },
  })
  const reservas = await prisma.insurer.upsert({
    where: { companyId_rnc: { companyId, rnc: '101023456' } },
    update: {},
    create: { companyId, name: 'Seguros Reservas', rnc: '101023456', legalName: 'Seguros Reservas SA', phone: '809-960-3000', email: 'ventas@segurosreservas.com', status: 'ACTIVA' },
  })
  const mapfre = await prisma.insurer.upsert({
    where: { companyId_rnc: { companyId, rnc: '101034567' } },
    update: {},
    create: { companyId, name: 'MAPFRE BHD Seguros', rnc: '101034567', legalName: 'MAPFRE BHD Compañía de Seguros SA', phone: '809-562-2000', email: 'corredor@mapfrebhd.com.do', status: 'ACTIVA' },
  })
  const perello = await prisma.insurer.upsert({
    where: { companyId_rnc: { companyId, rnc: '101045678' } },
    update: {},
    create: { companyId, name: 'Seguros Perelló', rnc: '101045678', legalName: 'Seguros Perelló SA', phone: '809-472-2020', email: 'info@segurosperello.com', status: 'ACTIVA' },
  })
  const colonial = await prisma.insurer.upsert({
    where: { companyId_rnc: { companyId, rnc: '101056789' } },
    update: {},
    create: { companyId, name: 'La Colonial de Seguros', rnc: '101056789', legalName: 'La Colonial de Seguros SA', phone: '809-544-2000', email: 'comercial@lacolonial.com.do', status: 'ACTIVA' },
  })

  console.log('Created insurers')

  // Insurer branches
  await prisma.insurerBranch.createMany({
    data: [
      { companyId, insurerId: universal.id, name: 'Seguros Universal - Principal', ramos: ['Vida', 'Salud', 'Vehículos', 'Incendio', 'Responsabilidad Civil'] },
      { companyId, insurerId: reservas.id, name: 'Seguros Reservas - Principal', ramos: ['Vida', 'Salud', 'Vehículos', 'Propiedad'] },
      { companyId, insurerId: mapfre.id, name: 'MAPFRE BHD - Principal', ramos: ['Vehículos', 'Salud', 'Vida', 'Hogar', 'PYME'] },
      { companyId, insurerId: perello.id, name: 'Seguros Perelló - Principal', ramos: ['Vida', 'Salud', 'Incendio'] },
      { companyId, insurerId: colonial.id, name: 'La Colonial - Principal', ramos: ['Vehículos', 'Vida', 'Salud', 'Fianzas'] },
    ],
    skipDuplicates: true,
  })

  console.log('Created insurer branches')

  // Commission Rules
  const typeMap: Record<string, number> = {}
  for (const t of insuranceTypes) {
    typeMap[t.name] = t.id
  }

  await prisma.commissionRule.createMany({
    data: [
      { companyId, insurerId: universal.id, insuranceTypeId: typeMap['Vehículos'], ratePercentage: 18, effectiveFrom: new Date('2024-01-01') },
      { companyId, insurerId: universal.id, insuranceTypeId: typeMap['Vida'], ratePercentage: 18, effectiveFrom: new Date('2024-01-01') },
      { companyId, insurerId: universal.id, insuranceTypeId: typeMap['Responsabilidad Civil'], ratePercentage: 18, effectiveFrom: new Date('2024-01-01') },
      { companyId, insurerId: reservas.id, insuranceTypeId: typeMap['Salud'], ratePercentage: 15, effectiveFrom: new Date('2024-01-01') },
      { companyId, insurerId: mapfre.id, insuranceTypeId: typeMap['PYME'], ratePercentage: 20, effectiveFrom: new Date('2024-01-01') },
      { companyId, insurerId: mapfre.id, insuranceTypeId: typeMap['Propiedad'], ratePercentage: 20, effectiveFrom: new Date('2024-01-01') },
      { companyId, insurerId: perello.id, insuranceTypeId: typeMap['Vida'], ratePercentage: 16, effectiveFrom: new Date('2024-01-01') },
      { companyId, insurerId: colonial.id, insuranceTypeId: typeMap['Vehículos'], ratePercentage: 17, effectiveFrom: new Date('2024-01-01') },
    ],
    skipDuplicates: true,
  })

  console.log('Created commission rules')

  // Clients
  const client1 = await prisma.client.upsert({
    where: { companyId_cedulaRnc: { companyId, cedulaRnc: '001-0012345-6' } },
    update: {},
    create: { companyId, type: 'FISICA', name: 'María García Pérez', cedulaRnc: '001-0012345-6', phone: '809-555-0101', email: 'maria.garcia@email.com', address: 'Av. Winston Churchill #45, Piantini, Santo Domingo', city: 'Santo Domingo', province: 'Distrito Nacional', status: 'ACTIVO', createdBy: adminUser.id },
  })
  const client2 = await prisma.client.upsert({
    where: { companyId_cedulaRnc: { companyId, cedulaRnc: '130456789' } },
    update: {},
    create: { companyId, type: 'JURIDICA', name: 'Comercial Rodríguez SRL', cedulaRnc: '130456789', phone: '809-555-0202', email: 'info@comercialrodriguez.com.do', address: 'C/ El Conde #200, Zona Colonial, Santo Domingo', city: 'Santo Domingo', province: 'Distrito Nacional', status: 'ACTIVO', createdBy: adminUser.id },
  })
  const client3 = await prisma.client.upsert({
    where: { companyId_cedulaRnc: { companyId, cedulaRnc: '402-0098765-4' } },
    update: {},
    create: { companyId, type: 'FISICA', name: 'Juan Martínez López', cedulaRnc: '402-0098765-4', phone: '829-555-0303', email: 'juan.martinez@email.com', address: 'Av. 27 de Febrero #300, Naco, Santo Domingo', city: 'Santo Domingo', province: 'Distrito Nacional', status: 'ACTIVO', createdBy: ejecutivo1.id },
  })
  const client4 = await prisma.client.upsert({
    where: { companyId_cedulaRnc: { companyId, cedulaRnc: '101234567' } },
    update: {},
    create: { companyId, type: 'JURIDICA', name: 'Inversiones del Caribe SA', cedulaRnc: '101234567', phone: '809-555-0404', email: 'admin@invcaribe.com.do', address: 'Av. Abraham Lincoln #900, Torre Empresarial', city: 'Santo Domingo', province: 'Distrito Nacional', status: 'SUSPENDIDO', createdBy: ejecutivo1.id },
  })
  const client5 = await prisma.client.upsert({
    where: { companyId_cedulaRnc: { companyId, cedulaRnc: '031-0054321-8' } },
    update: {},
    create: { companyId, type: 'FISICA', name: 'Ana Belén Sánchez', cedulaRnc: '031-0054321-8', phone: '849-555-0505', email: 'anabelen@email.com', address: 'C/ Duarte #55, Santiago de los Caballeros', city: 'Santiago', province: 'Santiago', status: 'ACTIVO', createdBy: ejecutivo2.id },
  })
  const client6 = await prisma.client.upsert({
    where: { companyId_cedulaRnc: { companyId, cedulaRnc: '001-0067890-2' } },
    update: {},
    create: { companyId, type: 'FISICA', name: 'Carlos Eduardo Reyes', cedulaRnc: '001-0067890-2', phone: '809-555-0606', email: 'carlos.reyes@email.com', address: 'Av. Lope de Vega #120, Ensanche Naco', city: 'Santo Domingo', province: 'Distrito Nacional', status: 'ACTIVO', createdBy: ejecutivo1.id },
  })
  const client7 = await prisma.client.upsert({
    where: { companyId_cedulaRnc: { companyId, cedulaRnc: '131567890' } },
    update: {},
    create: { companyId, type: 'JURIDICA', name: 'Tech Solutions Dominicana SRL', cedulaRnc: '131567890', phone: '809-555-0707', email: 'info@techsolutions.do', address: 'Blue Mall, Av. Churchill, Piso 8', city: 'Santo Domingo', province: 'Distrito Nacional', status: 'ACTIVO', createdBy: ejecutivo2.id },
  })

  console.log('Created clients')

  // Policies
  const pol1 = await prisma.policy.upsert({
    where: { companyId_policyNumber: { companyId, policyNumber: 'POL-2024-001' } },
    update: {},
    create: { companyId, policyNumber: 'POL-2024-001', clientId: client1.id, insurerId: universal.id, insuranceTypeId: typeMap['Vehículos'], startDate: new Date('2024-01-15'), endDate: new Date('2025-01-15'), premium: 28500, paymentMethod: 'MENSUAL', status: 'VIGENTE', createdBy: ejecutivo1.id },
  })
  const pol2 = await prisma.policy.upsert({
    where: { companyId_policyNumber: { companyId, policyNumber: 'POL-2024-002' } },
    update: {},
    create: { companyId, policyNumber: 'POL-2024-002', clientId: client2.id, insurerId: mapfre.id, insuranceTypeId: typeMap['PYME'], startDate: new Date('2024-02-01'), endDate: new Date('2025-02-01'), premium: 185000, paymentMethod: 'TRIMESTRAL', status: 'VIGENTE', createdBy: ejecutivo1.id },
  })
  const pol3 = await prisma.policy.upsert({
    where: { companyId_policyNumber: { companyId, policyNumber: 'POL-2024-003' } },
    update: {},
    create: { companyId, policyNumber: 'POL-2024-003', clientId: client1.id, insurerId: reservas.id, insuranceTypeId: typeMap['Salud'], startDate: new Date('2024-03-01'), endDate: new Date('2025-03-01'), premium: 45000, paymentMethod: 'MENSUAL', status: 'VIGENTE', createdBy: ejecutivo2.id },
  })
  await prisma.policy.upsert({
    where: { companyId_policyNumber: { companyId, policyNumber: 'POL-2024-004' } },
    update: {},
    create: { companyId, policyNumber: 'POL-2024-004', clientId: client3.id, insurerId: universal.id, insuranceTypeId: typeMap['Vida'], startDate: new Date('2024-04-01'), endDate: new Date('2025-04-01'), premium: 18000, paymentMethod: 'ANUAL', status: 'VIGENTE', createdBy: ejecutivo1.id },
  })
  const pol5 = await prisma.policy.upsert({
    where: { companyId_policyNumber: { companyId, policyNumber: 'POL-2024-005' } },
    update: {},
    create: { companyId, policyNumber: 'POL-2024-005', clientId: client4.id, insurerId: mapfre.id, insuranceTypeId: typeMap['Propiedad'], startDate: new Date('2023-11-01'), endDate: new Date('2024-11-01'), premium: 350000, paymentMethod: 'SEMESTRAL', status: 'VENCIDA', createdBy: ejecutivo1.id },
  })
  const pol6 = await prisma.policy.upsert({
    where: { companyId_policyNumber: { companyId, policyNumber: 'POL-2024-006' } },
    update: {},
    create: { companyId, policyNumber: 'POL-2024-006', clientId: client6.id, insurerId: colonial.id, insuranceTypeId: typeMap['Vehículos'], startDate: new Date('2024-05-15'), endDate: new Date('2025-05-15'), premium: 32000, paymentMethod: 'MENSUAL', status: 'VIGENTE', createdBy: ejecutivo1.id },
  })
  const pol7 = await prisma.policy.upsert({
    where: { companyId_policyNumber: { companyId, policyNumber: 'POL-2024-007' } },
    update: {},
    create: { companyId, policyNumber: 'POL-2024-007', clientId: client7.id, insurerId: universal.id, insuranceTypeId: typeMap['Responsabilidad Civil'], startDate: new Date('2024-06-01'), endDate: new Date('2025-06-01'), premium: 95000, paymentMethod: 'TRIMESTRAL', status: 'VIGENTE', createdBy: ejecutivo2.id },
  })
  const pol8 = await prisma.policy.upsert({
    where: { companyId_policyNumber: { companyId, policyNumber: 'POL-2024-008' } },
    update: {},
    create: { companyId, policyNumber: 'POL-2024-008', clientId: client2.id, insurerId: reservas.id, insuranceTypeId: typeMap['Salud'], startDate: new Date('2024-01-01'), endDate: new Date('2025-01-01'), premium: 120000, paymentMethod: 'MENSUAL', status: 'VIGENTE', createdBy: ejecutivo1.id },
  })
  await prisma.policy.upsert({
    where: { companyId_policyNumber: { companyId, policyNumber: 'POL-2024-009' } },
    update: {},
    create: { companyId, policyNumber: 'POL-2024-009', clientId: client5.id, insurerId: perello.id, insuranceTypeId: typeMap['Vida'], startDate: new Date('2024-07-01'), endDate: new Date('2025-07-01'), premium: 12000, paymentMethod: 'ANUAL', status: 'VIGENTE', createdBy: ejecutivo2.id },
  })

  console.log('Created policies')

  // Claims
  await prisma.claim.createMany({
    data: [
      { companyId, policyId: pol1.id, claimNumber: 'SIN-2024-001', type: 'Colisión', dateOccurred: new Date('2024-08-15'), description: 'Accidente de tránsito en Av. 27 de Febrero', estimatedAmount: 85000, status: 'EN_PROCESO', priority: 'ALTA', assignedTo: ejecutivo1.id },
      { companyId, policyId: pol3.id, claimNumber: 'SIN-2024-002', type: 'Hospitalización', dateOccurred: new Date('2024-09-01'), description: 'Procedimiento quirúrgico programado', estimatedAmount: 120000, approvedAmount: 120000, status: 'APROBADO', priority: 'MEDIA', assignedTo: ejecutivo2.id },
      { companyId, policyId: pol5.id, claimNumber: 'SIN-2024-003', type: 'Incendio', dateOccurred: new Date('2024-07-20'), description: 'Daños por cortocircuito en almacén principal', estimatedAmount: 450000, status: 'EN_REVISION', priority: 'ALTA', assignedTo: ejecutivo1.id },
      { companyId, policyId: pol6.id, claimNumber: 'SIN-2024-004', type: 'Robo', dateOccurred: new Date('2024-10-05'), description: 'Robo de vehículo en estacionamiento público', estimatedAmount: 650000, status: 'PENDIENTE', priority: 'ALTA' },
      { companyId, policyId: pol8.id, claimNumber: 'SIN-2024-005', type: 'Salud', dateOccurred: new Date('2024-10-10'), description: 'Atención de emergencia empleado', estimatedAmount: 35000, approvedAmount: 35000, status: 'PAGADO', priority: 'BAJA', assignedTo: ejecutivo2.id },
    ],
    skipDuplicates: true,
  })

  console.log('Created claims')

  // Payments
  await prisma.payment.createMany({
    data: [
      { companyId, policyId: pol1.id, clientId: client1.id, amount: 2375, paymentMethod: 'Transferencia', paymentDate: new Date('2024-10-01'), status: 'COMPLETADO', notes: 'Prima mensual Oct 2024', createdBy: contabilidad.id },
      { companyId, policyId: pol2.id, clientId: client2.id, amount: 46250, paymentMethod: 'Cheque', paymentDate: new Date('2024-10-01'), status: 'COMPLETADO', notes: 'Prima trimestral Q4 2024', createdBy: contabilidad.id },
      { companyId, policyId: pol3.id, clientId: client1.id, amount: 3750, paymentMethod: 'Tarjeta', paymentDate: new Date('2024-10-01'), status: 'COMPLETADO', notes: 'Prima mensual Oct 2024', createdBy: contabilidad.id },
      { companyId, policyId: pol6.id, clientId: client6.id, amount: 2667, paymentMethod: 'Transferencia', paymentDate: new Date('2024-10-15'), status: 'COMPLETADO', notes: 'Prima mensual Oct 2024', createdBy: contabilidad.id },
      { companyId, policyId: pol7.id, clientId: client7.id, amount: 23750, paymentMethod: 'Transferencia', paymentDate: new Date('2024-10-01'), status: 'PENDIENTE', notes: 'Prima trimestral Q4 2024', createdBy: contabilidad.id },
      { companyId, policyId: pol8.id, clientId: client2.id, amount: 10000, paymentMethod: 'Transferencia', paymentDate: new Date('2024-10-01'), status: 'COMPLETADO', notes: 'Prima mensual Oct 2024', createdBy: contabilidad.id },
    ],
    skipDuplicates: true,
  })

  console.log('Created payments')

  // Commissions
  await prisma.commission.createMany({
    data: [
      { companyId, policyId: pol1.id, producerId: ejecutivo1.id, premiumAmount: 28500, rate: 18, amount: 5130, period: 'Enero 2024', status: 'PAGADA', paidDate: new Date('2024-02-15') },
      { companyId, policyId: pol2.id, producerId: ejecutivo1.id, premiumAmount: 185000, rate: 20, amount: 37000, period: 'Febrero 2024', status: 'PAGADA', paidDate: new Date('2024-03-15') },
      { companyId, policyId: pol3.id, producerId: ejecutivo2.id, premiumAmount: 45000, rate: 15, amount: 6750, period: 'Marzo 2024', status: 'PAGADA', paidDate: new Date('2024-04-15') },
      { companyId, policyId: pol6.id, producerId: ejecutivo1.id, premiumAmount: 32000, rate: 17, amount: 5440, period: 'Mayo 2024', status: 'PENDIENTE' },
      { companyId, policyId: pol7.id, producerId: ejecutivo2.id, premiumAmount: 95000, rate: 18, amount: 17100, period: 'Junio 2024', status: 'PAGADA', paidDate: new Date('2024-07-15') },
    ],
    skipDuplicates: true,
  })

  console.log('Created commissions')

  // Renewals
  await prisma.renewal.createMany({
    data: [
      { companyId, policyId: pol1.id, originalEndDate: new Date('2025-01-15'), status: 'PENDIENTE' },
      { companyId, policyId: pol8.id, originalEndDate: new Date('2025-01-01'), status: 'PENDIENTE' },
      { companyId, policyId: pol2.id, originalEndDate: new Date('2025-02-01'), status: 'PENDIENTE' },
      { companyId, policyId: pol5.id, originalEndDate: new Date('2024-11-01'), status: 'VENCIDA' },
    ],
    skipDuplicates: true,
  })

  console.log('Created renewals')
  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
