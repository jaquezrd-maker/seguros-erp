import 'dotenv/config'
import prisma from './src/config/database'

async function createTestCompany() {
  // Create second company
  const company = await prisma.company.create({
    data: {
      name: 'Corredora de Prueba',
      slug: 'corredora-prueba',
      legalName: 'Corredora de Seguros de Prueba SRL',
      rnc: '131000001',
      email: 'info@prueba.com.do',
      phone: '809-555-2000',
      status: 'ACTIVO',
    },
  })

  console.log('Created company:', company)

  // Add admin user to this company
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@corredora.com.do' },
  })

  if (adminUser) {
    const companyUser = await prisma.companyUser.create({
      data: {
        userId: adminUser.id,
        companyId: company.id,
        role: 'ADMINISTRADOR',
        isActive: true,
      },
    })
    console.log('Added admin to company:', companyUser)

    // Seed default insurance types for this company
    const insuranceTypes = [
      { name: 'Vehículos', description: 'Seguros de automóviles y motocicletas', isActive: true },
      { name: 'Salud', description: 'Seguros de salud y gastos médicos', isActive: true },
      { name: 'Vida', description: 'Seguros de vida', isActive: true },
      { name: 'Propiedad', description: 'Seguros de propiedad y hogar', isActive: true },
      { name: 'Negocios', description: 'Seguros comerciales y empresariales', isActive: true },
    ]

    for (const type of insuranceTypes) {
      await prisma.insuranceType.create({
        data: {
          companyId: company.id,
          ...type,
        },
      })
    }

    console.log('Seeded insurance types for company')
  }

  console.log('\n✅ Test company created! Admin user now has access to 2 companies.')
}

createTestCompany()
  .then(() => {
    console.log('\n✅ Done')
    process.exit(0)
  })
  .catch(e => {
    console.error('Error:', e)
    process.exit(1)
  })
