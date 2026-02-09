import prisma from '../src/config/database'

async function createGeneralCommissionRules() {
  console.log('🔄 Creating general commission rules for all insurers...')

  // Get all insurers
  const insurers = await prisma.insurer.findMany({
    where: { status: 'ACTIVA' },
  })

  console.log(`Found ${insurers.length} active insurers`)

  let created = 0

  for (const insurer of insurers) {
    try {
      // Check if a general rule (no insurance type specified) already exists
      const existingRule = await prisma.commissionRule.findFirst({
        where: {
          insurerId: insurer.id,
          insuranceTypeId: null, // General rule for all types
        },
      })

      if (existingRule) {
        console.log(`✓ General rule already exists for ${insurer.name}`)
        continue
      }

      // Create a general commission rule with 15% rate
      const rule = await prisma.commissionRule.create({
        data: {
          insurerId: insurer.id,
          insuranceTypeId: null, // Applies to all insurance types
          ratePercentage: 15.0,
          effectiveFrom: new Date('2024-01-01'),
          effectiveTo: null, // No expiration
        },
      })

      console.log(`✅ Created general commission rule for ${insurer.name} at ${rule.ratePercentage}%`)
      created++
    } catch (error: any) {
      console.error(`❌ Error creating rule for ${insurer.name}:`, error.message)
    }
  }

  console.log('\n📊 Summary:')
  console.log(`  ✅ Created: ${created}`)
  console.log(`  📋 Total insurers: ${insurers.length}`)
}

createGeneralCommissionRules()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
