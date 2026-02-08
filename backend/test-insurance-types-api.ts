import prisma from './src/config/database'

async function testInsuranceTypesAPI() {
  try {
    console.log('Verificando tipos de seguro en la base de datos...\n')

    const types = await prisma.insuranceType.findMany({
      orderBy: { name: 'asc' },
    })

    if (types.length === 0) {
      console.log('❌ No hay tipos de seguro en la base de datos!')
      console.log('Ejecute: npm run seed')
      return
    }

    console.log(`✓ Encontrados ${types.length} tipos de seguro:\n`)
    types.forEach(t => {
      console.log(`  ${t.id.toString().padStart(2, ' ')} - ${t.name}`)
    })

    console.log('\n✓ La base de datos tiene tipos de seguro correctamente')
    console.log('\nSi el dropdown sigue vacío en el frontend:')
    console.log('1. Abra la consola del navegador (F12)')
    console.log('2. Recargue la página de pólizas')
    console.log('3. Revise si hay errores de CORS o autenticación')
    console.log('4. Verifique que aparezca: "Tipos de seguro cargados: [...]"')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testInsuranceTypesAPI()
