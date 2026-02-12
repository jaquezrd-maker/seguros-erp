import prisma from './src/config/database'

async function seedBasicData() {
  console.log('🌱 Iniciando seed básico...\n')

  try {
    // 1. Verificar que existe el super admin
    const superAdmin = await prisma.user.findUnique({ where: { id: 1 } })
    if (!superAdmin) {
      console.error('❌ Error: No se encontró el usuario super admin (ID: 1)')
      process.exit(1)
    }
    console.log(`✅ Super admin verificado: ${superAdmin.email}`)

    // 2. Obtener o crear compañía por defecto
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
    console.log(`✅ Compañía: ${defaultCompany.name}\n`)

    const companyId = defaultCompany.id

    // 3. Actualizar super admin con compañía activa
    await prisma.user.update({
      where: { id: 1 },
      data: { activeCompanyId: companyId },
    })

    // Crear relación CompanyUser si no existe
    await prisma.companyUser.upsert({
      where: { userId_companyId: { userId: 1, companyId } },
      update: {},
      create: {
        userId: 1,
        companyId,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    })

    // 4. Crear tipos de seguro
    console.log('📋 Creando tipos de seguro...')
    const insuranceTypes = await Promise.all([
      prisma.insuranceType.upsert({
        where: { companyId_name: { companyId, name: 'Vehículos' } },
        update: {},
        create: {
          companyId,
          name: 'Vehículos',
          category: 'Generales',
          description: 'Seguro de vehículos de motor',
        },
      }),
      prisma.insuranceType.upsert({
        where: { companyId_name: { companyId, name: 'Salud' } },
        update: {},
        create: {
          companyId,
          name: 'Salud',
          category: 'Personas',
          description: 'Seguro de salud y gastos médicos',
        },
      }),
      prisma.insuranceType.upsert({
        where: { companyId_name: { companyId, name: 'Vida' } },
        update: {},
        create: {
          companyId,
          name: 'Vida',
          category: 'Personas',
          description: 'Seguro de vida individual y colectivo',
        },
      }),
      prisma.insuranceType.upsert({
        where: { companyId_name: { companyId, name: 'Propiedad' } },
        update: {},
        create: {
          companyId,
          name: 'Propiedad',
          category: 'Generales',
          description: 'Seguro de propiedad e inmuebles',
        },
      }),
      prisma.insuranceType.upsert({
        where: { companyId_name: { companyId, name: 'Incendio' } },
        update: {},
        create: {
          companyId,
          name: 'Incendio',
          category: 'Generales',
          description: 'Seguro contra incendio y líneas aliadas',
        },
      }),
      prisma.insuranceType.upsert({
        where: { companyId_name: { companyId, name: 'Responsabilidad Civil' } },
        update: {},
        create: {
          companyId,
          name: 'Responsabilidad Civil',
          category: 'Generales',
          description: 'Seguro de responsabilidad civil general',
        },
      }),
      prisma.insuranceType.upsert({
        where: { companyId_name: { companyId, name: 'PYME' } },
        update: {},
        create: {
          companyId,
          name: 'PYME',
          category: 'Comercial',
          description: 'Paquete de seguros para pequeñas y medianas empresas',
        },
      }),
      prisma.insuranceType.upsert({
        where: { companyId_name: { companyId, name: 'Hogar' } },
        update: {},
        create: {
          companyId,
          name: 'Hogar',
          category: 'Generales',
          description: 'Seguro integral del hogar',
        },
      }),
      prisma.insuranceType.upsert({
        where: { companyId_name: { companyId, name: 'Fianzas' } },
        update: {},
        create: {
          companyId,
          name: 'Fianzas',
          category: 'Comercial',
          description: 'Fianzas y garantías',
        },
      }),
      prisma.insuranceType.upsert({
        where: { companyId_name: { companyId, name: 'Transporte' } },
        update: {},
        create: {
          companyId,
          name: 'Transporte',
          category: 'Generales',
          description: 'Seguro de transporte y carga',
        },
      }),
      prisma.insuranceType.upsert({
        where: { companyId_name: { companyId, name: 'Accidentes Personales' } },
        update: {},
        create: {
          companyId,
          name: 'Accidentes Personales',
          category: 'Personas',
          description: 'Seguro de accidentes personales',
        },
      }),
    ])
    console.log(`  ✅ ${insuranceTypes.length} tipos de seguro creados\n`)

    // 5. Crear aseguradoras principales de República Dominicana
    console.log('🏢 Creando aseguradoras...')
    const universal = await prisma.insurer.upsert({
      where: { companyId_rnc: { companyId, rnc: '101012345' } },
      update: {},
      create: {
        companyId,
        name: 'Seguros Universal',
        rnc: '101012345',
        legalName: 'Universal de Seguros SA',
        phone: '809-544-7111',
        email: 'comercial@universal.com.do',
        status: 'ACTIVA',
      },
    })

    const reservas = await prisma.insurer.upsert({
      where: { companyId_rnc: { companyId, rnc: '101023456' } },
      update: {},
      create: {
        companyId,
        name: 'Seguros Reservas',
        rnc: '101023456',
        legalName: 'Seguros Reservas SA',
        phone: '809-960-3000',
        email: 'ventas@segurosreservas.com',
        status: 'ACTIVA',
      },
    })

    const mapfre = await prisma.insurer.upsert({
      where: { companyId_rnc: { companyId, rnc: '101034567' } },
      update: {},
      create: {
        companyId,
        name: 'MAPFRE BHD Seguros',
        rnc: '101034567',
        legalName: 'MAPFRE BHD Compañía de Seguros SA',
        phone: '809-562-2000',
        email: 'corredor@mapfrebhd.com.do',
        status: 'ACTIVA',
      },
    })

    const colonial = await prisma.insurer.upsert({
      where: { companyId_rnc: { companyId, rnc: '101056789' } },
      update: {},
      create: {
        companyId,
        name: 'La Colonial de Seguros',
        rnc: '101056789',
        legalName: 'La Colonial de Seguros SA',
        phone: '809-544-2000',
        email: 'comercial@lacolonial.com.do',
        status: 'ACTIVA',
      },
    })

    const ars = await prisma.insurer.upsert({
      where: { companyId_rnc: { companyId, rnc: '101067890' } },
      update: {},
      create: {
        companyId,
        name: 'ARS Palic Salud',
        rnc: '101067890',
        legalName: 'ARS Palic Salud SA',
        phone: '809-333-3333',
        email: 'info@arspalic.com.do',
        status: 'ACTIVA',
      },
    })

    console.log('  ✅ 5 aseguradoras creadas\n')

    // 6. Crear sucursales de aseguradoras
    console.log('🏪 Creando sucursales...')
    await prisma.insurerBranch.createMany({
      data: [
        {
          companyId,
          insurerId: universal.id,
          name: 'Seguros Universal - Principal',
          ramos: ['Vida', 'Salud', 'Vehículos', 'Incendio', 'Responsabilidad Civil'],
        },
        {
          companyId,
          insurerId: reservas.id,
          name: 'Seguros Reservas - Principal',
          ramos: ['Vida', 'Salud', 'Vehículos', 'Propiedad'],
        },
        {
          companyId,
          insurerId: mapfre.id,
          name: 'MAPFRE BHD - Principal',
          ramos: ['Vehículos', 'Salud', 'Vida', 'Hogar', 'PYME'],
        },
        {
          companyId,
          insurerId: colonial.id,
          name: 'La Colonial - Principal',
          ramos: ['Vehículos', 'Vida', 'Salud', 'Fianzas'],
        },
        {
          companyId,
          insurerId: ars.id,
          name: 'ARS Palic - Principal',
          ramos: ['Salud', 'Accidentes Personales'],
        },
      ],
      skipDuplicates: true,
    })
    console.log('  ✅ Sucursales creadas\n')

    // 7. Crear reglas de comisión estándar
    console.log('💰 Creando reglas de comisión...')
    const typeMap: Record<string, number> = {}
    for (const t of insuranceTypes) {
      typeMap[t.name] = t.id
    }

    await prisma.commissionRule.createMany({
      data: [
        // Seguros Universal
        {
          companyId,
          insurerId: universal.id,
          insuranceTypeId: typeMap['Vehículos'],
          ratePercentage: 18,
          effectiveFrom: new Date('2024-01-01'),
        },
        {
          companyId,
          insurerId: universal.id,
          insuranceTypeId: typeMap['Vida'],
          ratePercentage: 18,
          effectiveFrom: new Date('2024-01-01'),
        },
        // Seguros Reservas
        {
          companyId,
          insurerId: reservas.id,
          insuranceTypeId: typeMap['Salud'],
          ratePercentage: 15,
          effectiveFrom: new Date('2024-01-01'),
        },
        {
          companyId,
          insurerId: reservas.id,
          insuranceTypeId: typeMap['Vehículos'],
          ratePercentage: 17,
          effectiveFrom: new Date('2024-01-01'),
        },
        // MAPFRE
        {
          companyId,
          insurerId: mapfre.id,
          insuranceTypeId: typeMap['PYME'],
          ratePercentage: 20,
          effectiveFrom: new Date('2024-01-01'),
        },
        {
          companyId,
          insurerId: mapfre.id,
          insuranceTypeId: typeMap['Hogar'],
          ratePercentage: 18,
          effectiveFrom: new Date('2024-01-01'),
        },
        // La Colonial
        {
          companyId,
          insurerId: colonial.id,
          insuranceTypeId: typeMap['Vehículos'],
          ratePercentage: 17,
          effectiveFrom: new Date('2024-01-01'),
        },
        {
          companyId,
          insurerId: colonial.id,
          insuranceTypeId: typeMap['Fianzas'],
          ratePercentage: 15,
          effectiveFrom: new Date('2024-01-01'),
        },
        // ARS Palic
        {
          companyId,
          insurerId: ars.id,
          insuranceTypeId: typeMap['Salud'],
          ratePercentage: 12,
          effectiveFrom: new Date('2024-01-01'),
        },
      ],
      skipDuplicates: true,
    })
    console.log('  ✅ Reglas de comisión creadas\n')

    // 8. Resumen
    console.log('📊 Resumen:')
    const counts = await Promise.all([
      prisma.insuranceType.count({ where: { companyId } }),
      prisma.insurer.count({ where: { companyId } }),
      prisma.insurerBranch.count({ where: { companyId } }),
      prisma.commissionRule.count({ where: { companyId } }),
    ])

    console.log(`  • Tipos de seguro: ${counts[0]}`)
    console.log(`  • Aseguradoras: ${counts[1]}`)
    console.log(`  • Sucursales: ${counts[2]}`)
    console.log(`  • Reglas de comisión: ${counts[3]}`)

    console.log('\n✅ Seed básico completado exitosamente!')
    console.log('🚀 Ya puedes empezar a usar el sistema')
  } catch (error) {
    console.error('❌ Error durante el seed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedBasicData().catch((error) => {
  console.error('Error fatal:', error)
  process.exit(1)
})
