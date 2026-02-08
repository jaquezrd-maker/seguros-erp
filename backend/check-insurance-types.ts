import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkInsuranceTypes() {
  try {
    const types = await prisma.insuranceType.findMany({
      orderBy: { name: 'asc' },
    })

    console.log(`Found ${types.length} insurance types:`)
    types.forEach(t => console.log(`  - ${t.id}: ${t.name}`))
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkInsuranceTypes()
