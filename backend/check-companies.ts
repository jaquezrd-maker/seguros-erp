import prisma from './src/config/database'

async function checkCompanies() {
  const companies = await prisma.company.findMany({
    include: {
      _count: {
        select: {
          companyUsers: true,
          clients: true,
          policies: true,
        }
      }
    }
  })
  
  console.log('Companies in database:', JSON.stringify(companies, null, 2))
  await prisma.$disconnect()
}

checkCompanies()
