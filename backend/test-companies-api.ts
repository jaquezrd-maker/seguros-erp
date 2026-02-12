import { setTenantContext, clearTenantContext } from './src/middleware/tenant-isolation.middleware'
import companiesService from './src/modules/companies/companies.service'

async function testAPI() {
  console.log('Testing companies API endpoint...\n')
  
  // Simulate SUPER_ADMIN access (no pagination)
  const result = await companiesService.findAll(1, 1000)
  
  console.log('Service returned:', JSON.stringify(result, null, 2))
  console.log('\nCompanies array:', JSON.stringify(result.companies, null, 2))
}

testAPI().catch(console.error).finally(() => process.exit(0))
