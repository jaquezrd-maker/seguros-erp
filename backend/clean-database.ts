import prisma from './src/config/database'

async function cleanDatabase() {
  console.log('🧹 Iniciando limpieza de la base de datos...\n')

  try {
    // 1. Eliminar datos transaccionales (respetando orden de dependencias)
    console.log('📋 Eliminando datos transaccionales...')

    // Eliminar notificaciones
    const notifications = await prisma.notification.deleteMany({})
    console.log(`  ✅ Notificaciones eliminadas: ${notifications.count}`)

    // Eliminar tareas
    const tasks = await prisma.task.deleteMany({})
    console.log(`  ✅ Tareas eliminadas: ${tasks.count}`)

    // Eliminar eventos
    const events = await prisma.event.deleteMany({})
    console.log(`  ✅ Eventos eliminados: ${events.count}`)

    // Eliminar comisiones
    const commissions = await prisma.commission.deleteMany({})
    console.log(`  ✅ Comisiones eliminadas: ${commissions.count}`)

    // Eliminar renovaciones
    const renewals = await prisma.renewal.deleteMany({})
    console.log(`  ✅ Renovaciones eliminadas: ${renewals.count}`)

    // Eliminar reclamos
    const claims = await prisma.claim.deleteMany({})
    console.log(`  ✅ Reclamos eliminados: ${claims.count}`)

    // Eliminar pagos
    const payments = await prisma.payment.deleteMany({})
    console.log(`  ✅ Pagos eliminados: ${payments.count}`)

    // Eliminar pólizas
    const policies = await prisma.policy.deleteMany({})
    console.log(`  ✅ Pólizas eliminadas: ${policies.count}`)

    // Eliminar clientes
    const clients = await prisma.client.deleteMany({})
    console.log(`  ✅ Clientes eliminados: ${clients.count}`)

    // Eliminar reglas de comisión (antes de aseguradoras)
    const commissionRules = await prisma.commissionRule.deleteMany({})
    console.log(`  ✅ Reglas de comisión eliminadas: ${commissionRules.count}`)

    // Eliminar tipos de seguro
    const insuranceTypes = await prisma.insuranceType.deleteMany({})
    console.log(`  ✅ Tipos de seguro eliminados: ${insuranceTypes.count}`)

    // Eliminar aseguradoras
    const insurers = await prisma.insurer.deleteMany({})
    console.log(`  ✅ Aseguradoras eliminadas: ${insurers.count}`)

    // 2. Eliminar usuarios excepto super admin (ID: 1)
    console.log('\n👥 Eliminando usuarios (excepto super admin)...')
    const users = await prisma.user.deleteMany({
      where: {
        id: { not: 1 }
      }
    })
    console.log(`  ✅ Usuarios eliminados: ${users.count}`)

    // 3. Verificar usuario super admin
    console.log('\n🔍 Verificando super admin...')
    const superAdmin = await prisma.user.findUnique({
      where: { id: 1 },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true
      }
    })

    if (superAdmin) {
      console.log('  ✅ Super admin preservado:')
      console.log(`     ID: ${superAdmin.id}`)
      console.log(`     Email: ${superAdmin.email}`)
      console.log(`     Nombre: ${superAdmin.name}`)
      console.log(`     Role: ${superAdmin.role}`)
      console.log(`     Status: ${superAdmin.status}`)
    } else {
      console.log('  ⚠️  ADVERTENCIA: No se encontró el super admin')
    }

    // 4. Resumen final
    console.log('\n📊 Resumen de limpieza:')
    const finalCounts = await Promise.all([
      prisma.client.count(),
      prisma.insurer.count(),
      prisma.policy.count(),
      prisma.payment.count(),
      prisma.claim.count(),
      prisma.renewal.count(),
      prisma.commission.count(),
      prisma.event.count(),
      prisma.task.count(),
      prisma.notification.count(),
      prisma.user.count(),
      prisma.insuranceType.count(),
      prisma.commissionRule.count(),
    ])

    console.log(`  Clientes: ${finalCounts[0]}`)
    console.log(`  Aseguradoras: ${finalCounts[1]}`)
    console.log(`  Pólizas: ${finalCounts[2]}`)
    console.log(`  Pagos: ${finalCounts[3]}`)
    console.log(`  Reclamos: ${finalCounts[4]}`)
    console.log(`  Renovaciones: ${finalCounts[5]}`)
    console.log(`  Comisiones: ${finalCounts[6]}`)
    console.log(`  Eventos: ${finalCounts[7]}`)
    console.log(`  Tareas: ${finalCounts[8]}`)
    console.log(`  Notificaciones: ${finalCounts[9]}`)
    console.log(`  Usuarios: ${finalCounts[10]}`)
    console.log(`  Tipos de seguro: ${finalCounts[11]}`)
    console.log(`  Reglas de comisión: ${finalCounts[12]}`)

    console.log('\n✅ Limpieza completada exitosamente!')
    console.log('🔐 Usuario super admin preservado: admin@corredora.com.do')

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

cleanDatabase()
  .catch((error) => {
    console.error('Error fatal:', error)
    process.exit(1)
  })
