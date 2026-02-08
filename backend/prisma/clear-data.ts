import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearData() {
  console.log('🗑️  Clearing test data from database...')
  console.log('📌 Manteniendo: Tipos de Seguro y Usuario Admin\n')

  try {
    // Delete in order respecting foreign key constraints
    await prisma.auditLog.deleteMany()
    console.log('✓ Cleared audit logs')

    await prisma.notification.deleteMany()
    console.log('✓ Cleared notifications')

    await prisma.document.deleteMany()
    console.log('✓ Cleared documents')

    await prisma.renewal.deleteMany()
    console.log('✓ Cleared renewals')

    await prisma.commission.deleteMany()
    console.log('✓ Cleared commissions')

    await prisma.payment.deleteMany()
    console.log('✓ Cleared payments')

    await prisma.claimNote.deleteMany()
    console.log('✓ Cleared claim notes')

    await prisma.claim.deleteMany()
    console.log('✓ Cleared claims')

    await prisma.endorsement.deleteMany()
    console.log('✓ Cleared endorsements')

    await prisma.policy.deleteMany()
    console.log('✓ Cleared policies')

    await prisma.clientContact.deleteMany()
    console.log('✓ Cleared client contacts')

    await prisma.client.deleteMany()
    console.log('✓ Cleared clients')

    await prisma.commissionRule.deleteMany()
    console.log('✓ Cleared commission rules')

    await prisma.insurerBranch.deleteMany()
    console.log('✓ Cleared insurer branches')

    await prisma.insurer.deleteMany()
    console.log('✓ Cleared insurers')

    // Keep insurance types - they are catalog data, not test data
    console.log('⏭️  Skipped insurance types (catalog data)')

    // Keep admin user, delete test users only
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: { not: 'admin@corredora.com.do' }
      }
    })
    console.log(`✓ Cleared ${deletedUsers.count} test users (kept admin)`)

    console.log('\n✅ Test data cleared successfully!')
    console.log('📌 Mantenidos:')
    console.log('   - Tipos de Seguro')
    console.log('   - Usuario Admin (admin@corredora.com.do)')
  } catch (error) {
    console.error('❌ Error clearing data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

clearData()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
